"use client";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import "swagger-themes/themes/dark.css";

type Props = {
  spec: object;
};

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ReactSwagger({ spec }: Props) {
  return (
    <div className="swagger-container">
      <SwaggerUI spec={spec} />
    </div>
  );
}
