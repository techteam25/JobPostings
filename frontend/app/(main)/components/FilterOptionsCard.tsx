import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

import { ChevronDown } from "lucide-react";

const FilterOptionsCard = () => (
  <Card className="col-span-3 h-fit border-none">
    <div className="bg-background rounded-lg p-6 shadow-sm">
      <CardHeader>
        <CardTitle className="text-card-foreground mb-6 text-xl font-bold">
          Filter
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Salary Range */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-card-foreground font-semibold">Salary Range</h3>
            <ChevronDown className="text-secondary-foreground h-5 w-5" />
          </div>
          <div className="mb-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="salary" className="h-4 w-4" />
              <span className="text-secondary-foreground">Under $1,000</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="salary" className="h-4 w-4" />
              <span className="text-secondary-foreground">$1,000 - $5,000</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="salary" className="h-4 w-4" />
              <span className="text-secondary-foreground">
                $5,000 - $10,000
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="salary"
                defaultChecked
                className="accent-primary h-4 w-4"
              />
              <span className="text-secondary-foreground">Custom</span>
            </label>
          </div>

          {/* Range Slider */}
          <div className="mt-4">
            <Slider
              defaultValue={[2500]}
              min={1000}
              step={50}
              max={10000}
              className="bg-brand-blue accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
            <div className="text-secondary-foreground mt-2 flex justify-between text-sm">
              <span>$1,050</span>
              <span>$10,000</span>
            </div>
          </div>
        </div>

        {/* Job Type */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-card-foreground font-semibold">Job Type</h3>
            <ChevronDown className="text-secondary-foreground h-5 w-5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-x-3 gap-y-3">
              <Label
                htmlFor="full-time"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Full-time
              </Label>
              <Checkbox id="full-time" className="h-4 w-4" />

              <Label
                htmlFor="part-time"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Part-time
              </Label>
              <Checkbox id="part-time" className="h-4 w-4" />

              <Label
                htmlFor="contract"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Contract
              </Label>
              <Checkbox id="contract" className="h-4 w-4" />

              <Label
                htmlFor="temporary"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Temporary
              </Label>
              <Checkbox id="temporary" className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  </Card>
);

export default FilterOptionsCard;
