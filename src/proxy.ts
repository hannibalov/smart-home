import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
    const response = NextResponse.next({ request });

    // Map NextRequest cookies to the shape expected by createServerClient
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    // NextRequest.cookies.getAll() returns RequestCookie objects;
                    // map to { name, value } which createServerClient expects.
                    try {
                        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }))
                    } catch {
                        return []
                    }
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Allow unauthenticated access to specific public routes.
    // Handle trailing slashes and locale prefixes (e.g., `/register/`, `/en/register`).
    const rawPath = request.nextUrl.pathname || '/'
    const pathSegments = rawPath.split('/').filter(Boolean) // Split and remove empty parts

    // Check if any segment is a public route or if it's an auth path
    const publicSegments = ['login', 'register']
    const isPublic = publicSegments.some((seg) => pathSegments.includes(seg))
    const isAuthPath = pathSegments[0] === 'auth' || (pathSegments[0] === 'api' && pathSegments[1] === 'auth')

    if (isPublic || isAuthPath) {
        return response
    }

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    ],
};
