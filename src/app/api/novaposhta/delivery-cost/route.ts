import { type NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY;
const SENDER_CITY_REF =
  process.env.NOVA_POSHTA_SENDER_CITY_REF ||
  "8d5a980d-391c-11dd-90d9-001a92567626";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cityRef = searchParams.get("cityRef") || "";
  const weight = parseFloat(searchParams.get("weight") || "1");
  const cost = parseFloat(searchParams.get("cost") || "0");

  // Безкоштовна доставка від 1500 грн
  if (cost >= 1500) {
    return NextResponse.json({ cost: 0 });
  }

  if (!API_KEY) {
    return NextResponse.json({ cost: 70 }); // Базова ціна
  }

  if (!cityRef) {
    return NextResponse.json({ cost: 70 }); // Базова ціна
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "InternetDocument",
        calledMethod: "getDocumentPrice",
        methodProperties: {
          CitySender: SENDER_CITY_REF,
          CityRecipient: cityRef,
          Weight: weight.toString(),
          ServiceType: "WarehouseWarehouse",
          Cost: cost.toString(),
          CargoType: "Cargo",
          SeatsAmount: "1",
        },
      }),
    });

    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const deliveryCost = parseFloat(data.data[0].Cost);
      return NextResponse.json({ cost: Math.round(deliveryCost || 70) });
    }

    return NextResponse.json({ cost: 70 }); // Базова ціна
  } catch (error) {
    console.error("Nova Poshta API error:", error);
    return NextResponse.json({ cost: 70 }); // Базова ціна
  }
}
