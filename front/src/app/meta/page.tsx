"use client";

import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight, List, PlusCircle } from "lucide-react";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { MetaVisualization } from "./visualization";
import { MetaForm } from "./form";
import { MetaList } from "./list";

export default function Meta() {
  const [hideForm, setHideForm] = useState(false);
  const [hideRunning, setHideRunning] = useState(false);

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
              className="flex flex-col gap-4  bg-content1 h-full  p-6"
            >
              <h1 className="text-2xl font-bold my-6 text-center">
                New Metagenomics
              </h1>
              <MetaForm />
            </Panel>
            <PanelResizeHandle className="w-1 dark:bg-primary-100 bg-primary-400 relative ">
              <Button
                onPress={() => setHideForm(!hideForm)}
                isIconOnly
                color="primary"
                variant="solid"
                size="sm"
                className="absolute top-2 left-1/2 -translate-x-1/2 dark:bg-primary-100 bg-primary-400 cursor-pointer z-10"
              >
                <ChevronLeft />
              </Button>
            </PanelResizeHandle>
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
          defaultSize={60}
          className="flex justify-center items-center bg-background "
        >
          <MetaVisualization />
        </Panel>

        {!hideRunning ? (
          <>
            <PanelResizeHandle className="w-1 dark:bg-primary-100 bg-primary-400 relative ">
              <Button
                onPress={() => setHideRunning(!hideRunning)}
                isIconOnly
                color="primary"
                variant="solid"
                size="sm"
                className="absolute top-2 left-1/2 -translate-x-1/2 dark:bg-primary-100 bg-primary-400 cursor-pointer z-10"
              >
                {hideRunning ? (
                  <ChevronLeft className="mr-4" />
                ) : (
                  <ChevronRight />
                )}
              </Button>
            </PanelResizeHandle>
            <Panel
              id="in-progress"
              order={hideForm ? 2 : 3}
              minSize={17}
              defaultSize={17}
              maxSize={30}
              className="flex flex-col gap-4 bg-content1 h-full p-6"
            >
              <h1 className="text-2xl font-bold my-6 text-center">
                Running Metagenomics
              </h1>
              <MetaList />
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
