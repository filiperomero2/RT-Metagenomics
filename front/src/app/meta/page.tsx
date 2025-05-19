"use client";

import { Button } from "@heroui/react";
import { List, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MetaForm } from "./form";
import { MetaList } from "./list";
import { MetaVisualization } from "./visualization";

export default function Meta() {
  const [hideForm, setHideForm] = useState(true);
  const [hideRunning, setHideRunning] = useState(true);

  return (
    <div className="h-[calc(100vh-65px)] bg-content1 relative overflow-clip">
      <PanelGroup direction="horizontal">
        {!hideForm ? (
          <>
            <Panel
              minSize={23}
              defaultSize={23}
              maxSize={50}
              id="form"
              order={1}
            >
              <div className="flex flex-col gap-4 bg-content1 h-full p-6 relative overflow-y-auto">
                <h1 className="text-2xl font-bold my-2 text-center">
                  New Metagenomics
                </h1>
                <MetaForm />
                <Button
                  onPress={() => setHideForm(!hideForm)}
                  isIconOnly
                  color="danger"
                  variant="faded"
                  size="sm"
                  className="absolute top-2 right-2  cursor-pointer z-10"
                >
                  <X />
                </Button>
              </div>
            </Panel>
            <PanelResizeHandle className="w-px bg-default-200 relative" />
          </>
        ) : (
          <Button
            onPress={() => setHideForm(!hideForm)}
            isIconOnly
            color="primary"
            variant="solid"
            size="lg"
            className="absolute top-2 -translate-x-1/4 dark:bg-primary-100 bg-primary-400 cursor-pointer z-10 p-2"
          >
            <PlusCircle className="ml-2 " />
          </Button>
        )}

        <Panel
          id="visualization"
          order={hideForm ? 1 : 2}
          defaultSize={hideRunning ? 80 : 60}
          className="flex justify-center items-center bg-background "
        >
          <MetaVisualization />
        </Panel>

        {!hideRunning ? (
          <>
            <PanelResizeHandle className="w-px bg-default-200 relative" />
            <Panel
              id="in-progress"
              order={hideForm ? 2 : 3}
              minSize={17}
              defaultSize={17}
              maxSize={30}
              className="flex flex-col gap-4 bg-content1 h-full p-6 relative"
            >
              <h1 className="text-2xl font-bold my-2 text-center">
                Running Metagenomics
              </h1>
              <MetaList />
              <Button
                onPress={() => setHideRunning(!hideRunning)}
                isIconOnly
                color="danger"
                variant="faded"
                size="sm"
                className="absolute top-2 right-2  cursor-pointer z-10"
              >
                <X />
              </Button>
            </Panel>
          </>
        ) : (
          <Button
            onPress={() => setHideRunning(!hideRunning)}
            isIconOnly
            color="primary"
            variant="solid"
            size="lg"
            className="absolute top-2 right-0 translate-x-1/4 dark:bg-primary-100 bg-primary-400 cursor-pointer z-10 p-2"
          >
            <List className="mr-2 " />
          </Button>
        )}
      </PanelGroup>
    </div>
  );
}
