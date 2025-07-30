"use client";
import { Pie, PieChart, Cell, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/utils";
import { Package, PieChartIcon } from "lucide-react";
import currency from "currency.js";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoryBreakdownChart({
  categoryBreakdown,
  isLoading,
}: {
  categoryBreakdown: {
    category: string;
    total: number;
    percentage: number;
  }[];
  isLoading: boolean;
}) {
  const chartData = useMemo(
    () =>
      categoryBreakdown.map((item) => ({
        category: item.category,
        total: item.total,
        percentage: item.percentage,
      })),
    [categoryBreakdown],
  );

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach(
      (item) =>
        (config[item.category] = {
          label: item.category,
          color:
            CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.Miscellaneous,
          icon: CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.Miscellaneous,
        }),
    );
    return config;
  }, [chartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mb-1 text-xl">Spending Summary</CardTitle>
        <CardDescription>
          Overview of all your spending across different categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-88 w-full" />
        ) : categoryBreakdown.length === 0 ? (
          <div className="flex size-full h-88 flex-col items-center justify-center text-center">
            <PieChartIcon className="text-muted-foreground mb-4 size-16" />
            <h4 className="text-lg font-extrabold">No spending data</h4>
            <p className="text-muted-foreground text-sm">
              Upload receipts to see your spending breakdown.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-square min-h-[20rem] w-full sm:aspect-video"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      const category = name as keyof typeof chartConfig;
                      const config = chartConfig[category];
                      const Icon = config?.icon ?? Package;
                      const pct =
                        (props as { payload: { percentage: number } }).payload
                          .percentage ?? 0;
                      return (
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-4" />
                          <div className="flex flex-col justify-between gap-0.5">
                            <span className="font-bold">{category}</span>
                            <span className="text-xs">
                              {currency(Number(value)).format()} (
                              {pct.toFixed(2)}
                              %)
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="category"
                innerRadius="40%"
                outerRadius="80%"
              >
                {chartData.map((entry, _) => (
                  <Cell
                    key={_}
                    fill={chartConfig[entry.category]?.color}
                    aria-label={entry.category}
                  />
                ))}
              </Pie>
              <Legend
                content={({ payload }) => {
                  return (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {payload?.map((entry, _) => {
                        const category =
                          entry.value as keyof typeof chartConfig;
                        const config = chartConfig[category];
                        const Icon = config?.icon ?? Package;
                        return (
                          <Badge
                            key={_}
                            variant="outline"
                            className="flex items-center gap-1 font-bold"
                            style={{ borderColor: entry.color }}
                          >
                            <Icon style={{ color: entry.color }} />
                            {entry.value}
                          </Badge>
                        );
                      })}
                    </div>
                  );
                }}
                verticalAlign="bottom"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
