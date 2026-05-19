import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "Loan Manager",
    short_name: "Loans",
    description: "Loan operations PWA for Jeevana and Phenix",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "DCS Lookup",
        short_name: "DCS",
        url: "/#dcs",
        description: "Open customer master lookup"
      },
      {
        name: "Record Payment",
        short_name: "Payment",
        url: "/#payment",
        description: "Record a UPI or bank payment"
      }
    ]
  });
}
