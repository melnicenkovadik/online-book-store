import { type NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "";

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Nova Poshta API key not configured" },
      { status: 500 },
    );
  }

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "Address",
        calledMethod: "searchSettlements",
        methodProperties: {
          CityName: query,
          Limit: 50,
        },
      }),
    });

    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const addresses = data.data[0]?.Addresses || [];
      const cities = addresses.map((item: any) => ({
        ref: item.DeliveryCity,
        name: item.Present,
        area: item.AreaDescription || "",
      }));
      return NextResponse.json(cities);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Nova Poshta API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 },
    );
  }
}
