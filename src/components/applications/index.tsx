"use client";

import React from "react";
import exampleRegister from "@/lib/applications/example";
import pgliteRegister from "@/lib/applications/pglite";

export default function ApplicationsRegister() {
    React.useEffect(() => {
        exampleRegister();
        pgliteRegister();
    }, []);
    return null;
}