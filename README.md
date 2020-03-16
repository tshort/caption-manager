# Caption manager

This is a VSCode extension to manage figure and table captions and cross references in the current document.
It is meant for Markdown files. 
Commonmark does not support figure and table cross references, so if you want numbered captions, these have to be manually managed.

## Features

This extension provides three commands:

`Captions: Show`: Shows a list of captions. When selected, the caption is highlighted in the document.

`Captions: Show references`: Shows a list of captions along with references. When selected, the reference is highlighted in the document.

`Captions: Renumber`: Renumbers captions in the document.

## Extension settings

The following two variables control how captions and references are looked up.

`regexes`: This is an array of regular expressions that is used for `Show` and `Renumber`.
The default for this is set up for a Hugo shortcode:

```
"caption label=\"(Figure )([0-9a-zA-Z\\-]*)\""
"caption label=\"(Table )([0-9a-zA-Z\\-]*)\""
```

It's best if you can find a regular expression that is unique for your captions. 
The regular expression must have two capturing blocks: the first is the caption label,
and the second is the number or other reference.
Here is an example that works if you start captions at the beginning of the line
and use a colon right after the number:

```
"^(Figure )([0-9a-zA-Z]*): "
"^(Table )([0-9a-zA-Z]*): "
```

`refregexes`: This is an array of regular expressions that is used for `Show references`.
The default is:

```
"(Figure )"
"(Table )"
```

## Be careful with `Renumber`

Renumber can be dangerous. It is replacing content in your document.
It's advisable to use `Show references` before renumbering.
If you have something like "See Figure 5 in `[this other page](other-page)`", and Figure 5 gets renamed, the content will be wrong.

Because it is replacing, bugs in this feature are more dangerous, too.

