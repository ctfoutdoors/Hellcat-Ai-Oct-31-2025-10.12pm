# ShipStation API Reference

## Get Shipment by Tracking Number

**Endpoint:** `GET /shipments?trackingNumber={trackingNumber}`

**Base URL:** `https://ssapi.shipstation.com`

**Authentication:** Basic Auth (API Key + API Secret)

## Key Fields for Case Creation

### Shipment Object
- `shipmentId` - Unique shipment ID
- `orderId` - Associated order ID
- `orderNumber` - Order number (for Customer Name lookup)
- `shipmentCost` - Original shipping cost
- `trackingNumber` - Tracking number
- `carrierCode` - Carrier code (e.g., "stamps_com", "fedex", "ups")
- `serviceCode` - Service type (e.g., "usps_first_class_mail", "fedex_ground")
- `shipDate` - Date shipped
- `createDate` - Date label created

### Ship To (Customer Info)
- `shipTo.name` - Customer name
- `shipTo.company` - Company name
- `shipTo.street1`, `street2`, `street3` - Address
- `shipTo.city`, `state`, `postalCode`, `country` - Location
- `shipTo.phone` - Phone number

### Package Details
- `weight.value` - Package weight value
- `weight.units` - Weight units (ounces, pounds, grams, kilograms)
- `dimensions.length`, `width`, `height` - Package dimensions
- `dimensions.units` - Dimension units (inches, centimeters)

### Shipment Items
- `shipmentItems[]` - Array of items in shipment
  - `sku` - Product SKU
  - `name` - Product name
  - `quantity` - Quantity shipped
  - `unitPrice` - Unit price
  - `weight` - Item weight

## Adjustment Fields
ShipStation doesn't directly provide "adjusted amount" - this needs to be calculated by:
1. Getting carrier invoice data (if available)
2. Comparing `shipmentCost` with actual carrier charge
3. Identifying dimensional weight adjustments
4. Checking for address correction fees
5. Verifying delivery guarantee compliance

## Example Response Structure
```json
{
  "shipments": [{
    "shipmentId": 33974374,
    "orderId": 43945660,
    "orderNumber": "100038-1",
    "shipmentCost": 1.93,
    "trackingNumber": "9400111899561704681189",
    "carrierCode": "stamps_com",
    "serviceCode": "usps_first_class_mail",
    "shipDate": "2014-10-03",
    "shipTo": {
      "name": "Customer Name",
      "street1": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "postalCode": "78703"
    },
    "weight": {
      "value": 1,
      "units": "ounces"
    },
    "dimensions": {
      "length": 10,
      "width": 8,
      "height": 4,
      "units": "inches"
    }
  }]
}
```
