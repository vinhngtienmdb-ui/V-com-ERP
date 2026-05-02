import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";

const project = new Project();
project.addSourceFilesAtPaths("src/components/**/*.tsx");

const files = project.getSourceFiles();

let changedCount = 0;

for (const file of files) {
  let fileChanged = false;
  const fileName = file.getBaseName();
  
  // Skip Dashboard and ui components
  if (fileName === "Dashboard.tsx" || file.getFilePath().includes("/ui/")) continue;

  const jsxElements = [...file.getDescendantsOfKind(SyntaxKind.JsxElement)];
  
  // We will collect file edits to apply in reverse order
  const edits: {start: number, end: number, newText: string}[] = [];

  for (const element of jsxElements) {
    const openingElement = element.getOpeningElement();
    if (openingElement.getTagNameNode().getText() === "div") {
      const classNameAttr = openingElement.getAttribute("className");
      if (classNameAttr && classNameAttr.getKind() === SyntaxKind.JsxAttribute) {
        const init = classNameAttr.getInitializer();
        if (init) {
          const classText = init.getText().replace(/['"`]/g, "");
          if (!classText.includes("grid")) continue;
          
          let cols = 0;
          const colMatches = classText.match(/grid-cols-(\d+)/g);
          if (colMatches && colMatches.length > 0) {
              const last = colMatches[colMatches.length - 1];
              cols = parseInt(last.replace("grid-cols-", ""));
          }
          
          if (cols >= 2 && !classText.includes("h-")) {
            const gapMatch = classText.match(/gap-(\d+)/);
            const gap = gapMatch ? parseInt(gapMatch[1]) * 4 : 24;

            let cardCount = 0;
            const children = element.getJsxChildren();
            for (const child of children) {
              if (child.getKind() === SyntaxKind.JsxElement) {
                 const childOpening = child.getOpeningElement();
                 if (childOpening.getTagNameNode().getText() === "div") {
                    const childClass = childOpening.getAttribute("className");
                    if (childClass && childClass.getKind() === SyntaxKind.JsxAttribute) {
                        const childInit = childClass.getInitializer();
                        let childClassText = "";
                        if (childInit) {
                            if (childInit.getKind() === SyntaxKind.StringLiteral) {
                                childClassText = childInit.getLiteralText();
                            } else {
                                childClassText = childInit.getText();
                            }
                        }
                        if (childClassText && (childClassText.includes("bg-") || childClassText.includes("rounded") || childClassText.includes("shadow") || childClassText.includes("border") || childClassText.includes("p-"))) {
                           cardCount++;
                        }
                    }
                 }
              }
            }

            if (cardCount > 0) {
                // Record the edits for the opening and closing tags
                const openTagName = openingElement.getTagNameNode();
                edits.push({
                   start: openTagName.getStart(),
                   end: openTagName.getEnd(),
                   newText: "DraggableGrid"
                });
                
                const closeTagName = element.getClosingElement().getTagNameNode();
                edits.push({
                   start: closeTagName.getStart(),
                   end: closeTagName.getEnd(),
                   newText: "DraggableGrid"
                });
                
                // Add columns and gap right after className
                const classNameEnd = classNameAttr.getEnd();
                edits.push({
                   start: classNameEnd,
                   end: classNameEnd,
                   newText: ` columns={${cols}} gap={${gap}}`
                });

                fileChanged = true;
                changedCount++;
            }
          }
        }
      }
    }
  }

  if (fileChanged) {
    // Sort edits in reverse order so replacements don't invalidate subsequent offsets
    edits.sort((a, b) => b.start - a.start);
    
    let fileText = file.getFullText();
    for (const edit of edits) {
       fileText = fileText.substring(0, edit.start) + edit.newText + fileText.substring(edit.end);
    }
    
    // Add import
    if (!fileText.includes("DraggableGrid")) {
       const isUi = file.getFilePath().includes("/ui/");
       const importPath = isUi ? "./DraggableGrid" : "./ui/DraggableGrid";
       fileText = `import { DraggableGrid } from '${importPath}';\n` + fileText;
    }
    
    fs.writeFileSync(file.getFilePath(), fileText);
  }
}

console.log(`Transformed ${changedCount} grids across files.`);
