import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <span className="inline-flex gap-1 items-center">
        Hello
        <InformationCircleIcon
          className="h-5 w-5 cursor-pointer text-indigo-600"
        />
      </span>
    </div>
  );
}

export default App;
