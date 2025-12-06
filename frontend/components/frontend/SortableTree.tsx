import dynamic from "next/dynamic";
const SortableTree = dynamic(() => import("./SortableTree"), { ssr: false });
