import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FieldSet,
  FieldLegend,
  Field,
  FieldLabel,
} from "@/components/ui/field";

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
        <FieldSet className="mb-6">
          <FieldLegend className="mb-4 flex w-full items-center justify-between font-semibold text-card-foreground">
            Salary Range
            <ChevronDown className="text-secondary-foreground size-5" />
          </FieldLegend>
          <RadioGroup
            defaultValue="custom"
            className="mb-4 flex flex-col gap-3"
          >
            <Field orientation="horizontal">
              <RadioGroupItem value="under-1000" id="salary-under-1000" />
              <FieldLabel
                htmlFor="salary-under-1000"
                className="font-normal text-secondary-foreground"
              >
                Under $1,000
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="1000-5000" id="salary-1000-5000" />
              <FieldLabel
                htmlFor="salary-1000-5000"
                className="font-normal text-secondary-foreground"
              >
                $1,000 - $5,000
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="5000-10000" id="salary-5000-10000" />
              <FieldLabel
                htmlFor="salary-5000-10000"
                className="font-normal text-secondary-foreground"
              >
                $5,000 - $10,000
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="custom" id="salary-custom" />
              <FieldLabel
                htmlFor="salary-custom"
                className="font-normal text-secondary-foreground"
              >
                Custom
              </FieldLabel>
            </Field>
          </RadioGroup>

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
        </FieldSet>

        {/* Job Type */}
        <FieldSet>
          <FieldLegend className="mb-4 flex w-full items-center justify-between font-semibold text-card-foreground">
            Job Type
            <ChevronDown className="text-secondary-foreground size-5" />
          </FieldLegend>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-x-3 gap-y-3">
              <Label
                htmlFor="full-time"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Full-time
              </Label>
              <Checkbox id="full-time" className="size-4" />

              <Label
                htmlFor="part-time"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Part-time
              </Label>
              <Checkbox id="part-time" className="size-4" />

              <Label
                htmlFor="contract"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Contract
              </Label>
              <Checkbox id="contract" className="size-4" />

              <Label
                htmlFor="temporary"
                className="text-secondary-foreground whitespace-nowrap"
              >
                Temporary
              </Label>
              <Checkbox id="temporary" className="size-4" />
            </div>
          </div>
        </FieldSet>
      </CardContent>
    </div>
  </Card>
);

export default FilterOptionsCard;
