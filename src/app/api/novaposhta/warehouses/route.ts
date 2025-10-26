import { type NextRequest, NextResponse } from "next/server";

const API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVA_POSHTA_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cityRef = searchParams.get("cityRef") || "";

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Nova Poshta API key not configured" },
      { status: 500 },
    );
  }

  if (!cityRef) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: "Address",
        calledMethod: "getWarehouses",
        methodProperties: {
          CityRef: cityRef,
          Limit: 100,
        },
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      const warehouses = data.data.map((item: any) => ({
        ref: item.Ref,
        description: item.Description,
        cityRef: item.CityRef,
        number: item.Number || "",
      }));
      return NextResponse.json(warehouses);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Nova Poshta API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 },
    );
  }
}
