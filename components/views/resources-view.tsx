import type React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export const ResourcesView: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="font-bold text-2xl">Patient Resources</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pakistan Healthcare Rights</CardTitle>
            <CardDescription>Learn about your rights under the PMDC and Consumer Protection Acts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-primary text-sm">
              <li>
                <a
                  href="https://www.google.com/search?q=Sehat+Sahulat+Program+Pakistan+Coverage+Details"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Sehat Sahulat Program Details
                </a>
              </li>
              <li>
                <a
                  href="https://www.google.com/search?q=Consumer+Court+Pakistan+Procedure+Medical+Billing"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Consumer Court Procedure
                </a>
              </li>
              <li>
                <a
                  href="https://www.google.com/search?q=Medical+Negligence+Laws+Pakistan"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Medical Negligence Laws
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Billing Codes (CPT)</CardTitle>
            <CardDescription>Understanding common procedure codes can help you spot upcoding.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2 text-primary text-sm">
              <li>
                <a
                  href="https://www.google.com/search?q=Common+CPT+Codes+Lookup"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Search CPT Codes
                </a>
              </li>
              <li>
                <a
                  href="https://www.google.com/search?q=Standard+Medical+Procedure+Rates+Pakistan+2024"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Standard Rates 2024
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
