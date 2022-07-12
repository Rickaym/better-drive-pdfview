const moreOptionsClassName =
  "ndfHFb-c4YZDc-z5C9Gb-LgbsSe ndfHFb-c4YZDc-to915-LgbsSe VIpgJd-TzA9Ye-eEGnhe ndfHFb-c4YZDc-LgbsSe";
const hideCommentsButtonClassName = "ndfHFb-c4YZDc-j7LFlb";

const pageControlBoxClassName = "ndfHFb-c4YZDc-nJjxad-nK2kYb-i5oIFb";
const pageNumBoxClassName = "ndfHFb-c4YZDc-DARUcf-NnAfwf-i5oIFb";
const pageNumBoxTextClassName = "ndfHFb-c4YZDc-DARUcf-NnAfwf-j4LONd";

const pdfContainerClassName =
  "ndfHFb-c4YZDc-cYSp0e-Oz6c3e ndfHFb-c4YZDc-cYSp0e-DARUcf-gSKZZ ndfHFb-c4YZDc-neVct-RCfa3e";
const pdfPageClassName = "ndfHFb-c4YZDc-cYSp0e-DARUcf-Df1ZY-bN97Pc-haAclf";

const commentDialogsClassName =
  "wvGCSb-pnL5fc-KUPHr-zJtgdf wvGCSb-pnL5fc-WlKKfd-LgbsSe-ZiwkRe wvGCSb-efwuC";

const upperDockClassName = "ndfHFb-c4YZDc-Wrql6b-LQLjdd";
const upperDockButtonClassName =
  "ndfHFb-c4YZDc-to915-LgbsSe ndfHFb-c4YZDc-C7uZwb-LgbsSe VIpgJd-TzA9Ye-eEGnhe ndfHFb-c4YZDc-LgbsSe ndfHFb-c4YZDc-C7uZwb-LgbsSe-SfQLQb-Bz112c";

const pageNumRegExp = /^Page(\d+)\/\d+$/;

const hoverButtonClassName = "better-drive-pdfview-hover-button";

function getElemByClassName(className: string) {
  return Array.from(
    document.getElementsByClassName(className) as HTMLCollectionOf<HTMLElement>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TogglableOptions {
  toggleName?: string;
}

function addTogglable(
  text: string,
  tooltip: string,
  className: string,
  parentClassName: string,
  onClick: (ev: Event) => void,
  extraOpts: TogglableOptions = {}
) {
  const togglable = document.createElement("div");
  togglable.style.userSelect = "none";
  togglable.textContent = text;
  togglable.className = className;
  togglable.ariaLabel = tooltip;
  togglable.addEventListener("click", (ev) => {
    if (extraOpts.toggleName) {
      togglable.textContent =
        togglable.textContent !== extraOpts.toggleName
          ? extraOpts.toggleName
          : text;
    }
    onClick(ev);
  });
  const parent = getElemByClassName(parentClassName);
  if (parent.length === 0) {
    console.log(
      `Parent with classname ${parentClassName} not found to append a child.`
    );
  } else {
    parent[0].appendChild(togglable);
  }
}

sleep(6000).then(() => {
  const pdfContainer = getElemByClassName(pdfContainerClassName)[0];
  const commentDialogues = getElemByClassName(commentDialogsClassName);

  const defPdfContainerLefts = pdfContainer.style.left;
  const defcommentDialoguesWidths = commentDialogues.map(
    (dialog) => dialog.style.width
  );

  function rebuildDOM() {
    pdfContainer.style.left = "117px";
    commentDialogues.forEach((dialog) => (dialog.style.width = "450px"));
  }

  function restoreDOM() {
    pdfContainer.style.left = defPdfContainerLefts;
    commentDialogues.forEach(
      (dialog, idx) => (dialog.style.width = defcommentDialoguesWidths[idx])
    );
  }

  const pages = getElemByClassName(pdfPageClassName);
  function gotoPage(pageNumber: number) {
    if (pages.length < pageNumber - 1 || pageNumber - 1 < 0) {
      alert(`Page number ${pageNumber} is invalid!`);
      return;
    }
    pages[pageNumber - 1].scrollIntoView({ behavior: "smooth" });
  }

  // Restore last read page if it exists
  chrome.storage.sync.get(document.location.href, (item) => {
    if (item && item[document.location.href]) {
      gotoPage(Number.parseInt(item[document.location.href]));
    }
  });

  var rebuilt = true;
  function toggleBuild() {
    if (rebuilt) {
      restoreDOM();
    } else {
      rebuildDOM();
    }
    rebuilt = !rebuilt;
  }

  // Initial DOM rebuild
  rebuildDOM();
  document.addEventListener("fullscreenchange", rebuildDOM);
  document.addEventListener("resize", restoreDOM);

  // Rebuild DOM on comments hidden/show
  // We may only attach the event listener to the "Hide Comments Column"
  // button when the user has clicked the "More Options" column
  getElemByClassName(moreOptionsClassName)[0].addEventListener("click", (_) => {
    var onOffCommentButton: HTMLElement | undefined;

    const moreButtons = getElemByClassName(hideCommentsButtonClassName);
    moreButtons.forEach((button) => {
      if (button.innerText.toLowerCase() == "hide comments column") {
        onOffCommentButton = button;
      }
    });

    if (onOffCommentButton) {
      onOffCommentButton.addEventListener("click", rebuildDOM);
    } else {
      console.log("Could not find on/off comment button.");
    }
  });

  // Add extra togglable buttons to the UI
  addTogglable(
    "Goto",
    "Auto Scroll To A Page",
    `${pageNumBoxTextClassName} ${hoverButtonClassName}`,
    pageControlBoxClassName,
    (ev) => {
      const pgNum = prompt("Specify the page number you would like to goto!");
      if (!pgNum) {
        return;
      } else if (Number.isNaN(pgNum)) {
        alert(`Page number ${pgNum} needs to be a number!`);
      } else {
        gotoPage(Number.parseInt(pgNum));
      }
    }
  );
  addTogglable(
    "Toggle Align",
    "Toggle UI Alignment",
    upperDockButtonClassName,
    upperDockClassName,
    (ev) => toggleBuild()
  );

  var darkMode = false;
  addTogglable(
    "Dark Mode",
    "Toggle Dark/Light Modes",
    upperDockButtonClassName,
    upperDockClassName,
    (ev) => {
      darkMode = !darkMode;
      if (darkMode) {
        pdfContainer.style.filter = "invert(100%)";
      } else {
        pdfContainer.style.filter = "unset";
      }
    },
    { toggleName: "Light Mode" }
  );

  // Observer "Page Number" mutation and cache into local storage for
  // later restoration
  const observer = new MutationObserver((mutationRecords) => {
    if (mutationRecords[0].target.textContent) {
      const result = pageNumRegExp.exec(mutationRecords[0].target.textContent);
      if (!result) {
        console.log(
          `PageNumber change ${mutationRecords[0].target.textContent} failed regex.`
        );
        return;
      }
      const pageNum = result.at(1);
      if (!pageNum || Number.isNaN(pageNum)) {
        console.log(`PageNumber ${pageNum} is not a number.`);
        return;
      }

      chrome.runtime.sendMessage({
        lastReadPage: Number.parseInt(pageNum),
      });
    }
  });
  const pageNoDisplay = getElemByClassName(pageNumBoxClassName)[0];
  observer.observe(pageNoDisplay, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true,
  });
});
