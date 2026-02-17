import { NextResponse, type NextRequest } from "next/server";

export default function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
