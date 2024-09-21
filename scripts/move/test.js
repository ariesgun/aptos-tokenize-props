require("dotenv").config();

const cli = require("@aptos-labs/ts-sdk/dist/common/cli/index.js");

async function test() {
  const move = new cli.Move();

  await move.test({
    packageDirectoryPath: "contract",
    namedAddresses: {
      // message_board_addr: "0x100",
      // message_board_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      // launchpad_addr: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      initial_creator_addr: process.env.NEXT_PUBLIC_COLLECTION_CREATOR_ADDRESS,
      property_test: process.env.NEXT_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
      admin_addr: process.env.NEXT_PUBLIC_COLLECTION_CREATOR_ADDRESS,
    },
  });
}
test();
