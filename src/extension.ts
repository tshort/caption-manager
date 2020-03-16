// Adapted from https://github.com/Mokkapps/jasmine-test-selector
// copyright  (c) 2018 Michael Hoffmann
// MIT license

import * as vscode from 'vscode';
import { TextDocument, TextLine, TextEditor, Range } from 'vscode';

interface Caption {
  lineText: TextLine;
  label: string;
  ref: string;
}

let settings = null;

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "caption-manager" is now active!'
  );
  settings = vscode.workspace.getConfiguration('caption-manager');

  let jumpToCaption = vscode.commands.registerCommand(
    'extension.jumpToCaption',
    () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      getCaptions(editor.document).then(async captions => {
        const arr: vscode.QuickPickItem[] = captions.map(caption => {
          return {
            label: (caption.lineText.lineNumber + 1) + ": " + caption.label + caption.ref,   // + "❗",
          };
        });

        const selection = await vscode.window.showQuickPick(arr, {
          placeHolder: 'Select a caption'
        });
        if (
          !selection ||
          !selection.label ||
          !selection.label.split(': ')[0]
        ) {
          console.log(`No valid selection made!`);
          return;
        }
        const lineNumber = selection.label.split(': ')[0];
        goToLine(Number(lineNumber));
      });
    }
  );

  let jumpToReference = vscode.commands.registerCommand(
    'extension.jumpToReference',
    () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      getReferences(editor.document).then(async captions => {
        const arr: vscode.QuickPickItem[] = captions.map(caption => {
          return {
            label: (caption.lineText.lineNumber + 1) + ": " + caption.lineText.text,   // + "❗",
          };
        });

        const selection = await vscode.window.showQuickPick(arr, {
          placeHolder: 'Select a reference'
        });
        if (
          !selection ||
          !selection.label ||
          !selection.label.split(': ')[0]
        ) {
          console.log(`No valid selection made!`);
          return;
        }
        const lineNumber = selection.label.split(': ')[0];
        goToLine(Number(lineNumber));
      });
    }
  );

  let renumberCaptions = vscode.commands.registerCommand(
    'extension.renumberCaptions',
    () => {
      let editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      getCaptions(editor.document).then(async captions => {
        let captionnum = 0;
        for (let i = 0; i < captions.length; i++) {
          captionnum = captionnum + 1;
          if (i > 0 && captions[i].label != captions[i-1].label) {
            captionnum = 1;
          }
          if (!Number(captions[i].ref) || Number(captions[i].ref) != captionnum) {
            var oldString = captions[i].label.concat(captions[i].ref).concat("(?![0-9a-zA-Z])");
            var newString = captions[i].label.concat("__captionmarker__").concat(String(captionnum));
            await replaceAll(oldString, newString);
          }
        }
        await replaceAll("__captionmarker__", "");
      });
    }
  );

  context.subscriptions.push(jumpToCaption);
  context.subscriptions.push(jumpToReference);
  context.subscriptions.push(renumberCaptions);
}

export function deactivate() {}

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
    const lastLineId = document.lineCount - 1;
    return new vscode.Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

async function replaceAll(oldString: string, newString: string) {
  // adapted from https://github.com/charleswan/vscode-extensions/blob/7bc5c362cc42c4d637f8651a52a2c003df6075e3/replaceChsMark/src/extension.ts#L22
  const textEditor = vscode.window.activeTextEditor;
  if (!textEditor) {
      return;  // No open text editor
  }
  let mytext = textEditor.document.getText();
  mytext = regExpReplace(mytext, oldString, newString);
  await textEditor.edit(function (editBuilder) {
    editBuilder.replace(fullDocumentRange(textEditor.document), mytext);
  });
}

function regExpReplace(mytext : string, oldString : string, newString : string) {
    let regex = new RegExp(oldString, "g");
    mytext = mytext.replace(regex, newString);
    return mytext;
}

function goToLine(line: number) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    console.error(`Cannot go to line ${line} as editor is not active`);
    return;
  }
  let range = editor.document.lineAt(line - 1).range;
  editor.selection = new vscode.Selection(range.start, range.end);
  editor.revealRange(range);
}

let regexes = [/caption label=\"(Figure )([0-9a-zA-Z\-]*)\"/,
               /caption label=\"(Table )([0-9a-zA-Z\-]*)\"/,
        ];
let refregexes = [/(Figure )/, /(Table )/ ];

function getCaptions(document: TextDocument): Promise<Caption[]> {
  // Return a promise, since this might take a while for large documents
  return new Promise<Caption[]>((resolve, reject) => {
    let captionsToReturn = new Array<Caption>();
    let lineCount = document.lineCount;
    
    for (var s of settings.regexes) {
      var r = new RegExp(s);
      for (let lineNumber = 0; lineNumber < lineCount; lineNumber++) {
        let lineText = document.lineAt(lineNumber);
        let captions = lineText.text.match(r);
        if (captions) {
          captionsToReturn.push({ lineText: lineText, label: captions[1], ref: captions[2] });
        }
      }
    }
    if (captionsToReturn.length > 0) {
      resolve(captionsToReturn);
    } else {
      reject('Found no captions');
    }
  }).catch();
}

function getReferences(document: TextDocument): Promise<Caption[]> {
  // Return a promise, since this might take a while for large documents
  return new Promise<Caption[]>((resolve, reject) => {
    let captionsToReturn = new Array<Caption>();
    let lineCount = document.lineCount;

    for (var s of settings.refregexes) {
      var r = new RegExp(s);
      for (let lineNumber = 0; lineNumber < lineCount; lineNumber++) {
        let lineText = document.lineAt(lineNumber);
        let captions = lineText.text.match(r);
        if (captions) {
          captionsToReturn.push({ lineText: lineText, label: captions[1], ref: captions[2] });
        }
      }
    }
    if (captionsToReturn.length > 0) {
      resolve(captionsToReturn);
    } else {
      reject('Found no references');
    }
  }).catch();
}
