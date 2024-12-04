"use client";

import React from "react";
import exampleRegister from "@/lib/applications/example";

export default function ApplicationsRegister() {
    React.useEffect(() => {
        exampleRegister();
    }, []);
    return null;
}