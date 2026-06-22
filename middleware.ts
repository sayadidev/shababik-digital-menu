import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip internal paths and any path with a file extension (static files)
  matcher: [
    "/((?!api|_next|_vercel|.+\\..+).*)",
  ],
};
