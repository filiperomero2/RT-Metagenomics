"use client";

import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { Button, SelectItem } from "@heroui/react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function Meta() {
  const [hideForm, setHideForm] = useState(false);
  const form = useForm({
    defaultValues: {
      dataType: "",
    },
  });

  const handleSubmit = (data: any) => {
    console.log("data", data);

    axios
      .post("/v1/metagenomics", data)
      .then((response) => {
        console.log("Response", response.data);
        // Handle success
      })
      .catch((error) => {
        console.error("Error", error);
        // Handle error
      });
    // Handle form submission logic here
  };

  return (
    <FormProvider {...form}>
      <div className="h-screen p-2 dark:bg-content1 bg-primary-50/10">
        <PanelGroup direction="horizontal">
          {!hideForm && (
            <>
              <Panel
                minSize={20}
                defaultSize={30}
                maxSize={50}
                id="form"
                order={1}
                className="flex flex-col gap-4 items-center dark:bg-content1 bg-primary-50/10 h-full justify-center p-6"
              >
                <h1 className="text-3xl font-bold">Metagenomics</h1>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="grid grid-cols-2 gap-x-3 gap-y-1 w-full"
                >
                  <Input
                    name="runName"
                    type="text"
                    label="Run Name"
                    className="col-span-2"
                  />
                  <Select
                    name="dataType"
                    label="Data Type"
                    className="col-span-2"
                  >
                    <SelectItem key="">Select</SelectItem>
                    <SelectItem key="illumina">Illumina</SelectItem>
                    <SelectItem key="nanopore">Nanopore</SelectItem>
                  </Select>
                  <Input name="sampleSheet" type="file" label="Sample Sheet" />
                  <Input name="output" type="file" label="Output Directory" />
                  <NumberInput name="threads" label="Threads" />
                  <NumberInput name="threadsTotal" label="Threads Total" />
                  <NumberInput name="trim" label="Trim" />
                  <NumberInput
                    name="minimumReadLength"
                    label="Minimum Read Length"
                  />
                  <Input
                    name="kraken2Database"
                    type="file"
                    label="Kraken2 Database"
                  />
                  <Input
                    name="kronaDatabase"
                    type="file"
                    label="Krona Database"
                  />
                  <Input
                    name="adapters"
                    type="file"
                    label="Adapters"
                    className="col-span-2"
                  />
                  <CheckBox
                    name="removeHumanReads"
                    label="Remove Human Reads"
                  />
                  <CheckBox
                    name="removeUnclassifiedReads"
                    label="Remove Unclassified Reads"
                  />
                  <Button
                    className="col-span-2 mt-5"
                    variant="solid"
                    color="primary"
                    type="submit"
                  >
                    Submit
                  </Button>
                </form>
              </Panel>
            </>
          )}
          <PanelResizeHandle className="w-1 dark:bg-primary-100 bg-primary-400 relative ">
            <Button
              onPress={() => setHideForm(!hideForm)}
              isIconOnly
              color="primary"
              variant="solid"
              size="sm"
              className="absolute top-2 left-1/2 -translate-x-1/2 dark:bg-primary-100 bg-primary-400 cursor-pointer z-10"
            >
              {hideForm ? <ChevronRight className="ml-4" /> : <ChevronLeft />}
            </Button>
          </PanelResizeHandle>

          <Panel
            order={2}
            defaultSize={70}
            className="flex justify-center items-center bg-background rounded-r-xl"
          >
            <div className="p-72 bg-primary rounded-full"></div>
          </Panel>
        </PanelGroup>
      </div>
    </FormProvider>
  );
}
