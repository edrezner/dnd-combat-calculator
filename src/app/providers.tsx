"use client";

import { ReactNode, useMemo } from "react";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

export default function Providers({ children }: { children: ReactNode }) {
    const client = useMemo(
        ()=> 
            new ApolloClient({
                link: new HttpLink({ uri: "/api/graphql" }),
                cache: new InMemoryCache(),
            }),
        []
    );

    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}