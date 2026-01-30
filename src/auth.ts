import NextAuth, { type NextAuthOptions, Account, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Call the validation endpoint
                    const response = await fetch(
                        `${process.env.NEXTAUTH_URL}/api/auth/validate-credentials`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                email: credentials.email,
                                password: credentials.password,
                            }),
                        }
                    );

                    if (!response.ok) {
                        return null;
                    }

                    const { user } = await response.json();

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error("Credentials authorization error:", error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle Google OAuth sign in
            if (account?.provider === 'google' && profile) {
                try {
                    // Sync Google user to database
                    const response = await fetch(
                        `${process.env.NEXTAUTH_URL}/api/auth/google-sync`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                google_id: profile.sub || account.providerAccountId,
                                email: profile.email,
                                name: profile.name,
                            }),
                        }
                    );

                    if (!response.ok) {
                        console.error('Failed to sync Google user');
                        return false;
                    }

                    const { user: dbUser } = await response.json();
                    // Store user ID from database in user object
                    user.id = dbUser.id;
                } catch (error) {
                    console.error('Error syncing Google user:', error);
                    return false;
                }
            }

            return true;
        },
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
