/// Original implementation: https://github.com/aptos-labs/aptos-core/blob/main/aptos-move/move-examples/swap/sources/coin_wrapper.move#L1-L208

/// This module can be included in a project to enable internal wrapping and unwrapping of fungible assets into coin.
/// This allows the project to only have to store and process fungible assets in core data structures, while still be
/// able to support both native fungible assets and coins. Note that the wrapper fungible assets are INTERNAL ONLY and
/// are not meant to be released to user's accounts outside of the project. Othwerwise, this would create multiple
/// conflicting fungible asset versions of a specific coin in the ecosystem.
///
/// The flow works as follows:
/// 1. Add the coin_wrapper module to the project.
/// 2. Add a friend declaration for any core modules that needs to call wrap/unwrap. Wrap/Unwrap are both friend-only
/// functions so external modules cannot call them and leak the internal fungible assets outside of the project.
/// 3. Add entry functions in the core modules that take coins. Those functions will be calling wrap to create the
/// internal fungible assets and store them.
/// 4. Add entry functions in the core modules that return coins. Those functions will be extract internal fungible
/// assets from the core data structures, unwrap them into and return the coins to the end users.
///
/// The fungible asset wrapper for a coin has the same name, symbol and decimals as the original coin. This allows for
/// easier accounting and tracking of the deposited/withdrawn coins.
module property_test::coin_wrapper {
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::aptos_account;
    use aptos_framework::coin::{Self, Coin, BurnCapability, FreezeCapability, MintCapability,};
    use aptos_framework::fungible_asset::{Self, BurnRef, FungibleAsset, Metadata, MintRef};
    use aptos_framework::object::{Self, Object, ExtendRef, ObjectCore};
    use aptos_framework::primary_fungible_store;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::string_utils;
    use aptos_std::type_info;
    use std::string::{Self, String, utf8};
    use std::option;
    use std::signer;
    use std::debug;
    use property_test::package_manager;
    use std::vector;

    // Modules in the same package that need to wrap/unwrap coins need to be added as friends here.
    // friend swap::router;
    friend property_test::controller;

    const COIN_WRAPPER_NAME: vector<u8> = b"COIN_FA_WRAPPER";

    struct WrapperCoin {}

    /// Stores the refs for a specific fungible asset wrapper for wrapping and unwrapping.
    struct FungibleAssetData has store {
        // Used during unwrapping to burn the internal fungible assets.
        burn_ref: BurnRef,
        // Reference to the metadata object.
        metadata: Object<Metadata>,
        // Used during wrapping to mint the internal fungible assets.
        mint_ref: MintRef,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct CapabilityStore<phantom CoinType> has key, store {
      burn_cap: BurnCapability<CoinType>,
      freeze_cap: FreezeCapability<CoinType>,
      mint_cap: MintCapability<CoinType>,
    }

    /// The resource stored in the main resource account to track all the fungible asset wrappers.
    /// This main resource account will also be the one holding all the deposited coins, each of which in a separate
    /// CoinStore<CoinType> resource. See coin.move in the Aptos Framework for more details.
    struct WrapperAccount has key {
        // The signer cap used to withdraw deposited coins from the main resource account during unwrapping so the
        // coins can be returned to the end users.
        signer_cap: SignerCapability,
        // Map from an original coin type (represented as strings such as "0x1::aptos_coin::AptosCoin") to the
        // corresponding fungible asset wrapper.
        coin_to_fungible_asset: SmartTable<String, FungibleAssetData>,
        // Map from a fungible asset wrapper to the original coin type.
        fungible_asset_to_coin: SmartTable<Object<Metadata>, String>,
    }

    struct WrapperAccountCoin has key {
      // Signer cap used to withdraw deposited coins from the main resource account during unwrapping.
      signer_cap: SignerCapability,
      // Map from an original FA to the coin wrapper.
      fungible_asset_to_coin: SmartTable<Object<Metadata>, Object<ObjectCore>>,
      // Map from a coin wrapper to origin FA
      coin_to_fungible_asset: SmartTable<String, Object<Metadata>>,
    }

    struct CoinRegistry has key {
      fungible_asset_to_coin_type: SmartTable<Object<Metadata>, String>
    }

    const APP_OBJECT_SEED: vector<u8> = b"COIN_WRAPPER";

    struct AppObjectController has key {
        extend_ref: ExtendRef,
    }

    /// Create the coin wrapper account to host all the deposited coins.
    fun init_module(admin: &signer) {
      initialize_mo(admin);
    }

    public fun initialize_mo(admin: &signer) {
        let obj_constructor_ref = object::create_named_object(admin, APP_OBJECT_SEED);
        let obj_signer = object::generate_signer(&obj_constructor_ref);
        let obj_extend_ref = object::generate_extend_ref(&obj_constructor_ref);

        move_to(
            &obj_signer,
            AppObjectController {
                extend_ref: obj_extend_ref,
            }
        );

        move_to(
            &obj_signer,
            CoinRegistry {
              fungible_asset_to_coin_type: smart_table::new(),
            }
        );
    }

    public fun get_app_address(): address {
        object::create_object_address(&@property_test, APP_OBJECT_SEED)
    }

    public entry fun initialize() {
        if (is_initialized()) {
            return
        };

        let swap_signer = &package_manager::get_signer();
        let (coin_wrapper_signer, signer_cap) = account::create_resource_account(swap_signer, COIN_WRAPPER_NAME);
        package_manager::add_address(string::utf8(COIN_WRAPPER_NAME), signer::address_of(&coin_wrapper_signer));

        // move_to(&coin_wrapper_signer, WrapperAccount {
        //     signer_cap,
        //     coin_to_fungible_asset: smart_table::new(),
        //     fungible_asset_to_coin: smart_table::new(),
        // });

        move_to(&coin_wrapper_signer, WrapperAccountCoin {
            signer_cap,
            coin_to_fungible_asset: smart_table::new(),
            fungible_asset_to_coin: smart_table::new(),
        });
    }

    #[view]
    public fun is_initialized(): bool {
        package_manager::address_exists(string::utf8(COIN_WRAPPER_NAME))
    }

    #[view]
    /// Return the address of the resource account that stores all deposited coins.
    public fun wrapper_address(): address {
        package_manager::get_address(string::utf8(COIN_WRAPPER_NAME))
    }

    #[view]
    /// Return whether a specific CoinType has a wrapper fungible asset. This is only the case if at least one wrap()
    /// call has been made for that CoinType.
    public fun is_supported<CoinType>(): bool acquires WrapperAccount {
        let coin_type = type_info::type_name<CoinType>();
        smart_table::contains(&wrapper_account().coin_to_fungible_asset, coin_type)
    }

    #[view]
    /// Return true if the given fungible asset is a wrapper fungible asset.
    public fun is_wrapper(metadata: Object<Metadata>): bool acquires WrapperAccount {
        smart_table::contains(&wrapper_account().fungible_asset_to_coin, metadata)
    }

    #[view]
    /// Return the original CoinType for a specific wrapper fungible asset. This errors out if there's no such wrapper.
    public fun get_coin_type(metadata: Object<Metadata>): String acquires WrapperAccount {
        *smart_table::borrow(&wrapper_account().fungible_asset_to_coin, metadata)
    }

    #[view]
    /// Return the wrapper fungible asset for a specific CoinType. This errors out if there's no such wrapper.
    public fun get_wrapper<CoinType>(): Object<Metadata> acquires WrapperAccount {
        fungible_asset_data<CoinType>().metadata
    }

    #[view]
    /// Return the original CoinType if the given fungible asset is a wrapper fungible asset. Otherwise, return the
    /// given fungible asset itself, which means it's a native fungible asset (not wrapped).
    /// The return value is a String such as "0x1::aptos_coin::AptosCoin" for an original coin or "0x12345" for a native
    /// fungible asset.
    public fun get_original(fungible_asset: Object<Metadata>): String acquires WrapperAccount {
        if (is_wrapper(fungible_asset)) {
            get_coin_type(fungible_asset)
        } else {
            format_fungible_asset(fungible_asset)
        }
    }

    #[view]
    /// Return the address string of a fungible asset (e.g. "0x1234").
    public fun format_fungible_asset(fungible_asset: Object<Metadata>): String {
        let fa_address = object::object_address(&fungible_asset);
        // This will create "@0x123"
        let fa_address_str = string_utils::to_string(&fa_address);
        // We want to strip the prefix "@"
        string::sub_string(&fa_address_str, 1, string::length(&fa_address_str))
    }

    /// Wrap the given coins into fungible asset. This will also create the fungible asset wrapper if it doesn't exist
    /// yet. The coins will be deposited into the main resource account.
    public(friend) fun wrap<CoinType>(coins: Coin<CoinType>): FungibleAsset acquires WrapperAccount {
        // Ensure the corresponding fungible asset has already been created.
        create_fungible_asset<CoinType>();

        // Deposit coins into the main resource account and mint&return the wrapper fungible assets.
        let amount = coin::value(&coins);
        aptos_account::deposit_coins(wrapper_address(), coins);
        let mint_ref = &fungible_asset_data<CoinType>().mint_ref;
        fungible_asset::mint(mint_ref, amount)
    }

    public(friend) fun wrap_fa<CoinType>(fa: FungibleAsset): Coin<CoinType> acquires WrapperAccountCoin, CapabilityStore {
        // Ensure the corresponding fungible asset has already been created.
        let metadata = fungible_asset::asset_metadata(&fa);
        // create_coin_asset<CoinType>(metadata);

        // Deposit coins into the main resource account and mint&return the wrapper fungible assets.
        let amount = fungible_asset::amount(&fa);
        let mint_cap = &fungible_asset_data_fa<CoinType>(metadata).mint_cap;

        primary_fungible_store::deposit(wrapper_address(), fa);
        coin::mint(amount, mint_cap)
    }

    /// Unwrap the given fungible asset into coins. This will burn the fungible asset and withdraw&return the coins from
    /// the main resource account.
    /// This errors out if the given fungible asset is not a wrapper fungible asset.
    public(friend) fun unwrap<CoinType>(fa: FungibleAsset): Coin<CoinType> acquires WrapperAccount {
        let amount = fungible_asset::amount(&fa);
        let burn_ref = &fungible_asset_data<CoinType>().burn_ref;
        fungible_asset::burn(burn_ref, fa);
        let wrapper_signer = &account::create_signer_with_capability(&wrapper_account().signer_cap);
        coin::withdraw(wrapper_signer, amount)
    }

    public entry fun create_coin<CoinType>(
        account: &signer,
        name: string::String,
        symbol: string::String,
        decimals: u8,
        monitor_supply: bool,
    ) acquires AppObjectController {
        // Initialize coin info at coin type publisher's account,
        // returning coin capabilities (this fails is the calling
        // account is not the coin type publisher).
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CoinType>(
            account,
            name,
            symbol,
            decimals,
            monitor_supply
        );
        // coin::register<CoinType>(account);
        // let minted = coin::mint<CoinType>(10, &mint_cap);
        // coin::deposit<CoinType>(signer::address_of(account), minted);

        // Store capabilities under the publisher's account.
        // let obj_signer = object::generate_signer(&obj_constructor_ref);

        let object_addr = object::create_object_address(&@property_test, APP_OBJECT_SEED);
        let object_controller = borrow_global<AppObjectController>(object_addr);
        let obj_signer = object::generate_signer_for_extending(&object_controller.extend_ref);

        move_to(&obj_signer, CapabilityStore<CoinType> {
            burn_cap,
            freeze_cap,
            mint_cap,
        });
    }

    public entry fun mint_fake<CoinType>(
      account: &signer,
    ) acquires CapabilityStore {
        debug::print(&coin::is_account_registered<CoinType>(signer::address_of(account)));
        debug::print(&coin::is_coin_initialized<CoinType>());

        let object_addr = object::create_object_address(&@property_test, APP_OBJECT_SEED);
        let capability = borrow_global<CapabilityStore<CoinType>>(object_addr);
        // coin::register<CoinType>(account);
        if (!coin::is_account_registered<CoinType>(signer::address_of(account))) {
            // Regiser one.
          coin::register<CoinType>(account);
        };
        let minted = coin::mint<CoinType>(10, &capability.mint_cap);
        coin::deposit<CoinType>(signer::address_of(account), minted);
    }

    #[view]
    public fun get_name<CoinType>(): String {
        coin::name<CoinType>()
    }

    public(friend) fun unwrap_fa<CoinType>(coins: Coin<CoinType>): FungibleAsset acquires WrapperAccountCoin, CapabilityStore {
        let amount = coin::value(&coins);
        // aptos_account::deposit_coins(wrapper_address(), coins);
        let type_name = type_info::type_name<CoinType>();

        let fa = *smart_table::borrow(&wrapper_account_fa().coin_to_fungible_asset, type_name);
        let burn_cap = &fungible_asset_data_fa<CoinType>(fa).burn_cap;
        coin::burn(coins, burn_cap);
        // let mint_ref = &fungible_asset_data<CoinType>().mint_ref;
        let from_wallet = primary_fungible_store::primary_store<Metadata>(wrapper_address(), fa);
        let wrapper_signer = &account::create_signer_with_capability(&wrapper_account_fa().signer_cap);
        fungible_asset::withdraw(wrapper_signer, from_wallet, amount)
    }

    // Create the coin give CoinType if it doesn't exist yet.
    public(friend) fun create_coin_asset<CoinType>(
      account: &signer,
      fa_metadata: Object<Metadata>
    ) acquires WrapperAccountCoin, CoinRegistry {
      // Initialize coin info at coin type publisher's account,
      // returning coin capabilities (this fails is the calling
      // account is not the coin type publisher).
      assert!(!coin::is_coin_initialized<CoinType>(), 13);

      let coin_type = type_info::type_name<CoinType>();
      let coin_name: String = utf8(b"W");
      let coin_symbol: String = utf8(b"w");
      string::append(&mut coin_name, fungible_asset::name(fa_metadata));
      string::append(&mut coin_symbol, fungible_asset::symbol(fa_metadata));

      debug::print(&coin_name);
      debug::print(&coin_symbol);

      let wrapper_account = mut_wrapper_account_fa();
      //   let wrapper_signer = &account::create_signer_with_capability(&wrapper_account.signer_cap);
      let fungible_asset_to_coin = &mut wrapper_account.fungible_asset_to_coin;

      if (!smart_table::contains(fungible_asset_to_coin, fa_metadata)) {
        // Cannot initialize
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CoinType>(
          account,
          coin_name,
          coin_symbol,
          fungible_asset::decimals(fa_metadata),
          false
        );

        let obj_constructor_ref = object::create_object(@property_test);
        let obj_signer = object::generate_signer(&obj_constructor_ref);
        let obj_cap = object::object_from_constructor_ref(&obj_constructor_ref);

        move_to(
            &obj_signer,
            CapabilityStore<CoinType> {
                burn_cap,
                freeze_cap,
                mint_cap,
            }
        );

        smart_table::add(fungible_asset_to_coin, fa_metadata, obj_cap);
        smart_table::add(&mut wrapper_account.coin_to_fungible_asset, coin_type, fa_metadata);

        let registry_coin = mut_registry_coin();
        smart_table::add(&mut registry_coin.fungible_asset_to_coin_type, fa_metadata, coin_type);

      }
    }

    #[view]
    public fun get_coin_type_from_fa(metadata: Object<Metadata>) : String acquires CoinRegistry {
      let registry_coin = registry_coin();
      let fa_to_coin = &registry_coin.fungible_asset_to_coin_type;
      assert!(smart_table::contains(fa_to_coin, metadata), 12);

      *smart_table::borrow(fa_to_coin, metadata)
    }

    /// Create the fungible asset wrapper for the given CoinType if it doesn't exist yet.
    public(friend) fun create_fungible_asset<CoinType>(): Object<Metadata> acquires WrapperAccount {
        let coin_type = type_info::type_name<CoinType>();
        let wrapper_account = mut_wrapper_account();
        let coin_to_fungible_asset = &mut wrapper_account.coin_to_fungible_asset;
        let wrapper_signer = &account::create_signer_with_capability(&wrapper_account.signer_cap);
        if (!smart_table::contains(coin_to_fungible_asset, coin_type)) {
            let metadata_constructor_ref = &object::create_named_object(wrapper_signer, *string::bytes(&coin_type));
            primary_fungible_store::create_primary_store_enabled_fungible_asset(
                metadata_constructor_ref,
                option::none(),
                coin::name<CoinType>(),
                coin::symbol<CoinType>(),
                coin::decimals<CoinType>(),
                string::utf8(b""),
                string::utf8(b""),
            );

            let mint_ref = fungible_asset::generate_mint_ref(metadata_constructor_ref);
            let burn_ref = fungible_asset::generate_burn_ref(metadata_constructor_ref);
            let metadata = object::object_from_constructor_ref<Metadata>(metadata_constructor_ref);
            smart_table::add(coin_to_fungible_asset, coin_type, FungibleAssetData {
                metadata,
                mint_ref,
                burn_ref,
            });
            smart_table::add(&mut wrapper_account.fungible_asset_to_coin, metadata, coin_type);
        };
        smart_table::borrow(coin_to_fungible_asset, coin_type).metadata
    }

    inline fun fungible_asset_data<CoinType>(): &FungibleAssetData acquires WrapperAccount {
        let coin_type = type_info::type_name<CoinType>();
        smart_table::borrow(&wrapper_account().coin_to_fungible_asset, coin_type)
    }

    inline fun fungible_asset_data_fa<CoinType>(fa: Object<Metadata>): &CapabilityStore<CoinType> acquires WrapperAccountCoin, CapabilityStore {
        let coin_obj = smart_table::borrow(&wrapper_account_fa().fungible_asset_to_coin, fa);
        borrow_global<CapabilityStore<CoinType>>(object::object_address(coin_obj))
    }

    inline fun wrapper_account(): &WrapperAccount acquires WrapperAccount {
        borrow_global<WrapperAccount>(wrapper_address())
    }

    inline fun wrapper_account_fa(): &WrapperAccountCoin acquires WrapperAccountCoin {
        borrow_global<WrapperAccountCoin>(wrapper_address())
    }

    inline fun mut_wrapper_account(): &mut WrapperAccount acquires WrapperAccount {
        borrow_global_mut<WrapperAccount>(wrapper_address())
    }

    inline fun mut_wrapper_account_fa(): &mut WrapperAccountCoin acquires WrapperAccountCoin {
        borrow_global_mut<WrapperAccountCoin>(wrapper_address())
    }

    inline fun registry_coin(): &CoinRegistry acquires CoinRegistry {
        borrow_global<CoinRegistry>(get_app_address())
    }
    inline fun mut_registry_coin(): &mut CoinRegistry acquires CoinRegistry {
        borrow_global_mut<CoinRegistry>(get_app_address())
    }

    // #[test_only]
    // friend swap::coin_wrapper_tests;
}