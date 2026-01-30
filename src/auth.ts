import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// NOTE: For production, use AWS Cognito provider or implement custom database integration
// For now, this uses credentials provider as a placeholder

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string;
            image?: string;
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // TODO: Implement your own credentials logic here
                // This could connect to:
                // 1. AWS Cognito Admin API
                // 2. Your own database with bcrypt
                // 3. AWS Amplify

                // For now, reject all credential attempts
                // Replace this with actual authentication logic
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Example: validate against your backend
                // const user = await validateUserCredentials(credentials.email, credentials.password);
                // if (user) return user;

                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub || "";
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
};

export default NextAuth(authOptions);
