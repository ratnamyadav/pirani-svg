import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

interface PiraniData {
  title: string;
  variantTitle: string;
  sku: string;
  customizationType: string;
  customizationValue: string;
  customizationFont: string;
  previewUrl: string;
  svgUrl: string;
  color: string;
  quantity: number;
  barcode: string;
  created: string;
}

export const piraniRouter = createTRPCRouter({
  getPiraniData: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        // Get current date in YYMMDD format
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const dateCode = `${year}${month}${day}`;
        
        const response = await fetch(`https://pir-prod.pirani.life/co/${dateCode}/${input.code}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data: PiraniData = await response.json();
        return data;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch Pirani data");
      }
    }),
});
