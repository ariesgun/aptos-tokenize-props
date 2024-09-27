import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MAP_API_KEY } from "@/env";

export interface PropertyDetailTabProps {
  propertyMetadata: any;
}

export function PropertyDetailTab({
  propertyMetadata,
}: PropertyDetailTabProps) {

  return (
    <Tabs defaultValue="financials" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="financials">Financials</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="location">Map Location</TabsTrigger>
      </TabsList>
      <TabsContent value="financials">
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>
              Quarterly Financial Reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 ml-4">
            <div className="space-y-1">
              <ul className="list-disc">
                <li>Annual Income Report 2023</li>
                <li>Q1 Financial Report 2024</li>
                <li>Q2 Financial Report 2024</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Important documents related to this property will be listed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 ml-4">
            <div className="space-y-1">
              <ul className="list-disc">
                <li>Property Deed</li>
                <li>Appraisal Report</li>
                <li>Inspection Report</li>
                <li>Rental Agreement</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="location">
        <Card>
          <CardHeader>
            <CardTitle>Map Location</CardTitle>
            <CardDescription>
              {`Property location. ${propertyMetadata?.properties?.address}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <iframe
                width="100%"
                height="600"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${MAP_API_KEY}&q=${propertyMetadata?.properties?.address}">`}>
              </iframe>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs >
  )
}