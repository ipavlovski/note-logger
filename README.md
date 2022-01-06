IMPLEMENTATION PLAN:
- use lowdb with lodash as the database
- can setup either express or websockets as a way to 'receive' data

How to copy images?
- copy range into clipboard
- press C-v






LATEST SET OF FEATURES

FEATURE: categorical view vs. chronological view
- categorical view: custom tree/nested-order
- chronologigcal: linear time-based order

FEATURE: search and filter
- parameters:
  - search: headline and body
  - filter: categories, tags, date-range
  - custom: metadata manual fields
- additive and subtractive
  - additive: cat1 + cat2
  - subtractive: cat* - cat-other
- specify 'leaf/branch' inclusion
  - eg. exclude all branch nodes (e.g. youtube channel description)
  - eg. exclude all leafs of certain depth 
    (e.g. only get channel descriptions)

FEATURE: different layouts based on screen size
- browser-size or mobile
- can hide sidebar
- can flip between editor and previewview (e.g. left/right swipe)
- eg. triple-view, dual-view, single0view

FEATURE: custom editor elements
- special syntax in markdown to 'markup' entries
- header, category, tags, date blick (e.g. ::: - :::)
- special metadata block: with key-value pairs (e.g. ;;; --- ;;;)
- can have custom markup for custom elements (e.g. warning/info/etc)

FEATURE: preview selection as html
- select text in the editor, and preview as html
- can have several preview locations: 
  overlay editor, preview in content section, etc.

FEATURE: edit html entry as markdown
- click into the entry and edit its markdown
- gray-out everything else to ensure no simultaneous multiple edits are there
- can edit an entry to fix any typoes/erorrs/etc.
- editing is done mostly for error, not for 'updating information'
- use archiving feature for re-writing

FEATURE: archive entries
- when updateing content, create new section
- then archive old content
- this keeps a 'rolling current version' of things

FEATURE: drag-n-drop sidebar to re-order
- in categorical view, can 'move' etnries around
- different filters may need to be 'accounted for'
  eg. the order affects filtered-out items also
- may need to 'select' items in filtered view, and then 'expand' filter

FEATURE: split html block
- after highlighting text, can 'split it'
- don't need to 'join' it (can just 'undo' it)
- may also use special '-----' syntaax as a shortcut way

FEATURE: omnibar
- Ombinar may be useful: show the current 'filter' (needs to be sticky)
- Instead of a sticky omnibar, better to include 'smart popup bar'.
- Smart popup bar:
  - remember the last query
  - provide access to 'search history'
  - allow mapping of 'favourite searches' while enabled

FEATURE: undo/redo
- split operations
- create new entries
- changing tags / metadata
- archive/unarchive
- reordering in categories

FEATURE: back/forward navigation
- use back/forward navigation to retrack scroll jumps
  as if it was history

FEATURE: autocompletion in editor
- autocmplete tags, categories, boxes, etc.

FEATURE: send to terminal and codeblicks
- support different code highlighting
- send-to-terminal interaction with existing system

FEATURE: create entry from selection
- in the editor, select text and 'send it for creation'
- parse custom syntax to extract categories, tags, headers, date
- have a set of 'defaults':
  - default date: current date
  - default category: 'daily log (e.g. 2021-10-01 Monday'
  - defaul tag: unsorted
  - default header: just some text in hte 

FEATURE: sidebar formatting and annotation
- in chronological view, can annottae 'dates' 
  e.g. based on custom cutoff time (like 5am)
- in categorical view, cn setup custom dividers
  this would help distinguish different 

FEATURE: dynamc syncing of sidebar and content entries
- show 'visible entries' highlighted in the sidebar
- e.g. if can see 4 entries in viewport, highligh all of them

























































Features:
- 2 types of views:
  - categorical
    display items in categorical order
  - chronological
    display items in chronological order
- search and filter syntax
  - date range
  - tags (additive, subtracive)
  - category (additive, subtractive)
  - body / headline (fuzzy)
  - metadata (custom fields)
- small screen / large screen display elements
  - single view: editor (can switch to content)
  - dual view: content, editor (sidebar hidden treeview)
  - triple view: tree, content, editor
- daily recordng format
  - default edito reporesents 'day edit'
  - manually 'extract' bits into entries (e.g. from selection)
- plain-text format for all elements
  - metadata blocks for custom content
  - categories, tags, timestmap custom blick
- archive over versioning
  - instead of editing older entries, re-write them from scratch
  - then archive the previous 'version'
  - this creates a 'rolling snapshot' of an item
- interchange of markdown and html-render
  - easily copy 'markdown' from html code





Priot to coding, need to develop general architecute / sketches of the UI:
- use figma for all the stuff?

Ombinar may be useful: show the current 'filter' (needs to be sticky)
Instead of a sticky omnibar, better to include 'smart popup bar'.
Smart popup bar:
- remember the last query
- provide access to 'search history'
- allow mapping of 'favourite searches' while enabled

What if 'date' is the default category?
There is 'nothing special' about it, it is just a 'catch-all' category.
Each day, it is saved just like the others. 

No need to 'edit' blocks inside.

Undo/Redo:
- split/join operations
- create new entries
- changing tags / metadata
- archive/unarchive

Split/Join:
- split: highlight something
  at the end of the highlight, will split the thing
  the new element will inherit a new 'title' based on content
  can then 're-write' the name of the new element using omnibar
  the 'date' is converved, with seconds appended to it
- join: select 2 elements
  the 2nd element becomes a part of the first, with capitalized headline

Edit:

- the edit is not the 


UI summary:
- 3 scrollable boxes: tree, content, editor

Editor Section:
- send 'regions' as entries
  e.g. using C+S+enter
- preview (similar to gitlab), except using the region only
- interact with xterm/terminal
- autocompletion of categories, tags, filenames
- parsing of special markup (headlines, tags, metadata)
- special 'insert' wrappers from clipboard

Conent section:
- enter edit mode (e.g. using C-e command)
- run a 'split' command (e.g. C-/)
- mirror the tree sidebar
- copy categories/tags

Tree:
- multi-select entries
- drag and drop


FEATURE: send editor region as an entry
- Region is a selection in the editor
- e.g. use C+S+enter to create entry from region

FEATURE: preview an editor region
- select a region in the editor
- generate a preview
- similar to gitlab, except it is 'on-demand'


FINE TOUCHES:
- grey-out other-content during 'editing'
- highlight the element in the sidebar during editing
- use back/forward navigation to retrack scroll jumps
  as if they were history
- annotations in the sidebar (dates, use 5am as divider)
- default 'categories' query for sidebar preview
- default 'chronological' query for sidebar preview
- show 'visible entries' highlighted in the sidebar















# OMNIBAR

## QUERY INTERFACE

Querying:
- categories (c)
- tags (t)
- headlines (h)
- body (b)
- date (d)


## FUZZY FLAG

A shortcut to enable fuzze-search mode.

Do fuzzy-search through:
- categories
- tags
- headlines
- body


## METADATA FLAG

Provide a flag to include metadata entries for display.

## PREVIEW FLAG

Provide a flag to perform dynamic preview.

When searching in the omnibar, can have 3 types of preview:
- full: update all of the etnries (scrollable)
- semi-dynamic: update sidebar only
- none: don't update the preview


## KEYS

Basic inteface:
- use 'tab' to autocomplete
- use 'enter' to select
- use 'escape' to 
- use 'ctrl+enter' to create 'NEW' tags/categories
cancel





# SCRATCH-EDITOR

## METADATA INHERTIANCE FROM OMBINAR

When a 'view' is active, 'saving' the editor applies the filter to it.
When creating a new entry, inherit some metadata.
'Date sorting' filters do not apply to the inheritance.



# SECTION-AREA

## METADATA INHERITANCE FROM OMNIBAR

A view: a 'filter' currently active.
At any point, there is always a 'filter'.
If there is no filter - then the default filter is 'date sorting'.




# SECTION

# LOG-ENTRY

## METADATA STRUCTURE

5 metadata fields:
- tag: tree-based
- category: tree-based
- description: a 'header' for the given entry
- date: date created, date updated
- type: markdown vs. snippet

Tags:
- each entry can have multiple tags
- in order to 'rename' tags, pull-up all the entries

Categories:
- youtube / channel / video
- forum / forum-name / post
- reddit / subreddit / post
- blog / blogname / post
- stackexchange / site / post
- projects / project / topic



LOG-ITEM > METADATA

- headline (e.g. Download images into DB using filenames as paths)
- timestamp (date, hour/minute, timezone)
- categories and tags
- descritpion/code-snippet (can be a few)





# LOG-TREE

## STRUCTURE

Flat list of entries.
Each entry is of fairly fixed size.


## QUERYING

Can query the log-tree

CSS/UI: provide an interface that allows to sort/filter/query by:
- date range
- category and tag
- text search (headlines vs. full-body)













# APP

## CORE LAYOUT

4 core elements:
- sections: show all the currently listed entries
- scratch-editor
- omnibar: a search-interface for quickly querying results
- headers: list of tree-like headers
  


## ITEM SELECTION / UI CHANGES

- use shift to select 1 or multiple entries 
  (or deselect selected ones)
- can use ctlr+shift+a to select ALL the entries
- sidebar gets highlighed on selection
- an entry gets highlighted also


## LINKING

Linking can be done using:
- entry's ID (use a shortcut to copy the ID)
- metadata combination (e.g. tag)

## BACK / HISTORY

Record histroy of searches.
Each time a 'view' changes, make that a 'history' event.


## LIGHT GALLERY

Use light-gallery as the main image display.
May utilize it also to preview documents.

## PERSISTENCE

Persistent is done through a server backend.
For each entry, all METADATA is cached.
The content however is not.
When 'querying' for the data, really querying the 


## RESPONSIVE LAYOUTS

Will have several responsive layouts:
- vertical half
  standard view
- vertical narrow
  same as vertical half, but no TOC. Can use a 'shortcut' for dynamic popup
- horizontal narrow
  editor/omnibar on the right, scrolling elements in the middle, scrolling TOC on left








# SCENARIOS

## BASIC BOOTUP

On bootup, need to open-up the application.
The application automatically starts with `systemctl` unit.
Open up a chromium window, can rename it for easy `wmctrl` shortcuts.
Open to a `url.local` address (eg. `knowledge-base.local`).

The initial view is populated using a 7-day date filter.
If there was any 'redisual' unsaved stuff in the editor, it is loaded up in there.
To check that everything loaded ok, can scroll-down all the way to the bottom.
It should stop loading entries at the very end and show nothing else.

## SAVE THE EDIT, THEN APPLY METADATA

After the edit is saved, it goes into the entry view.
There can highlight it.
The '1 selected' pops up in the omnibar.
Can apply the categories/tags/descriptions.


## APPLY FILTER, THEN SAVE THE EDIT

## SELECT AN ENTRY, THEN 


LOG-TREE > QUERY

Only 2 types of filters:
- cagegory
- tag

category is just a 'filteration' filter.
can do additive or subtractice filters on it
no category == all categories
a list of categories == these specific categories
negative list == exclude these categories



LOG-TREE > QUERY > TAGS

tags by default are 'OR'
simply list tags
can do AND tags (e.g. 3d AND metal)
There is specificity to tags:
Metalwork > welding > mig, tig, stick > aluminum, steel
metal:steel, metal:aluminum
welding:tig, welding:mig
technique:welding, technique:cutting, technique:grinder
metalwork, metal:steel, metal:aluminum,


LOG-TREE > QUERY

when searching for tags, all the categories will be consireded.
e.g. searching for 'tag:metal' would show manu youtube channels, cnc forums, reddit, etc.
the sidebar would have most of the hierarchy:
- reddit
  - subreddit1
    - topic1
      - entry title
      - titleless entry (use first few words)
      - entry title
    - topic2


The caregories are being matched by path.
In the case of category>youtube, tag:metadata:, both channel and videos will be matched.
youtube
  channel-name-1
    video-name
      entry1
      entry2

youtube
  channel-name-1
    entry1
    entry2
    video-name-1
      entry1
      entry2
    video-name-2
      entry1
      entry2

The category names are virtual, only entries are 'real'
IN the entries display, separate these 'virtual names' as lines.
When clicking on the 'virutal entry', center view on the line.

Ordering priority.
Each entry can have a 'priority' number.
It reflects the preferred 'order' of the item in the list.
It can be changed by simply moving the item in the sidebar view.


HEADER-AREA > METADATA

Why have metadata entry at all?

Eg. sometimes want to get a list of all the channels for a particular set of tags.
E.g. when referencing various youtube videos, pre-create the different 'channel categories'.

Can only create categories through omnibar.
Also need to have a 'selection' when creating a category.
Can either select the editor OR create a blank entry and select that.
Then will assign it a category:
youtube > 'some channel name'
This will create a 2nd-level youtube category.


Custom METADATA entry.
Can contain a 'data' object inside the entry.
The entry object gets written to the json representation of the entry.
Can only have ONE METADATA entry per category.

e.g. 
youtube
  (metadata)
  channel-name-1
    (channel-metadata)
    video-1
      (video-metadata)
      entry-1
      entry-2
    video-2
      (video-metadata)
      entry-1
      entry-2
  channel-name-1
    (channel-metadata)
    video-1
      (video-metadata)
      entry-1
      entry-2
    video-2
      (video-metadata)
      entry-1
      entry-2

Metadata's data objet are just a key-value pair table.
Just a simple way to provide an 'editor' interface for json data.
Can use this metadata to apply custom 'sorting'.

Metadata entries can be 'auto-generated' with the creation of categories.
They can also include 'dynamically-generated-content' which cna't be edited.
E.g. summary of tags / entries in a category.
When the metadata post is being edited - need to lock the 'movement' of the sidebar.
THis way it will not interfere with the variables in the editor.


Categories are just categories: a string/object.
Category: ["A", "b", "c"]
Another: ["A", "two", "three"]

When searching
youtube>great scott, tag: channel - would display all the channels, no video entries
Will also have a single 'metadata' entry.

youtube>great scott, tag: video

Can have a special 'METADATA' tag.
It can contain various 'data' associated with this categoery.
Some of the data may be 'autogenerated' (e.g. the number of videos).





HEADER-AREA > DYNAMICS

Sidebar has several dynamic functionalities:
- minimize trees by level, show number of entries (to improve visibility)
- enter-tree (e.g. re-run the filter with current category)
- re-arrange order
- show 'currently displaying'


SCRATH-EDITOR > PINNING

Pinning the editors.
Whenever starting to edit something, pin the entry-line  under the omnibar.
Clickin on it will make it easy to come-back to it.
Maybe set a limit on the number of 'editable' items.



SECTION-ENTRY > SNIPPETS

Snippet entry vs. Markdown entry

Can try to edit the snipepts directly.
If can determine that the element underneath is a 'codeblock', and get the lang.















Topics:
- omnibar
- general shortcuts
- data embedding
- display sorting
- back bar / history
- custom rendering
- persistence and websockets
- no separate tag/category storage
- jit rendering with intersection observer
- 'find similar' option ()
- automatically assign tags/categoreis based on search

Omnibar visuals:
- show search-icon when using in search mode
- when a block is selected, 
- use shift to select 

automatically preview search content, but don't put it into history
when pressing 'enter' - consolidate it, add to history

pressing back/forward during editing:
during editing, ask to 'save changes'.
can't swtich from an editing block.
perhaps can 'pin it' to the top for further editing 


What if the entire sublime was scrapped altogether.
Instead, just use the web interface.

Just a textbox...
After a certian wait, it uses a 'marked' or 'markdown-it' extension to parse the markdown into html.

Clearly de-lieanate the blicks.

Monaco Editor - the editor to use
Marked/Markdown-it - the 'parser'

Instead of using 'sublime', will be using the browser.
Ideally would kill-off the address-bar and tabs, for 'minimal' interface.


PREVIEW FUNCTION
During editing - use a 'hotkey' to generate a read-only 'preview'.
It will display how the browser will show the parsed markdown.


REVISIONS
For each block, can have multiple revisions.
Each revision is 'dated'.
Revisions can be 'compressed' by 'day'.

CACHE LATEST HTML REVISION
Keep a rendered copy of the latest html revision.

SAVING PROGRESS
Text changes are constantly 'saved'.
When writing text in a block, automatically.

DBL-CLICK TO EDIT
When editing, query the raw markdown code.

JUMP TO EDIT LINE
When 'double-clicking' - can enter an 'edit' mode.


https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html
- addCommand
  https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-listening-to-key-events
- getModel
  https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.itextmodel.html
- onDidChangeModelContent
  https://stackoverflow.com/questions/48828538/monaco-editor-onchange-event

LIGHT GALLERY
JS Galleries:
- lightGallery
- nanogallery2
- photoswipe

Will use lightGallery - has support for webp/webm


SEND TO TERMINAL
Will need to setup a 'send to terminal' function.

AST STRUCTURE
- block uuid
- revision date / revision content
- html render
- tags
- resource_id: owner resource (e.g. url/category)
  url: youtube > channel > video
  url: page > subpage
  url: reddit > subreddit > post 
  category: project > project-name
  categpry: topic > subtopic

CUSTOM LINKING
Create UUID-based linking.
Provide description.

TOP BOX UI
Provide a 'top box' entry space for making edits.
It should always be there.
Once an 'edit' is complete - the markdown appears below.

SPLIT UP BLOCKS
May need a variable known as 'from'.
To track whether a block is 'original' or 'splitup'.

URLS and YOUTUBE
A part of the system contains url and youtube tables in DB.

CODEPEN REFERENCES
Can try to embed codepen snippets.

TIGHT LINKS BETWEEN NODES
If in vide processing one part (e.g. intro contains embedded video),
And the other contains 'startup-time' link.
May make the start-up block use intro as a 'dependency'.
Such that when things are queries, intro is always pulled together with statup block.

HOVER PREVIEW
When hovering over a link to something, can prview its contents.
Using a 'popup'/modal










SESSION > BACKEND/FRONTNED

The backend keeps track of all the variables.
Anytime a variable is changed.
Can use master/slave design.
Only a single client per session can control scroll.

Frontend keeps a record of the current session.
The backend must have a matching session.
Frontend can request a 'new session' to be created.






SECTION-AREA > PRELOADING

When the element hits an 'end', request data for the next element.
This way rendering is quick, as long as scrolling speed.
Anytime there is a jump, will need to take time to refresh.

Based on the viewport, preload a certain amount of data



RENDERER > ELEMENTS REFERENCE

Setup a reference doc showing all the:
- markup element
  eg. custom link
- html translation
  a special href with data-link property
- display css
  describe how the element is presened (e.g. use special highlight color)
- javascript behaviour
  whether clicking appends to view, or resets the view





LOG-ITEM > LINKING

2 types of link:
- query link: resets the view
- entry link: adds to the view

Use special syntax for linking, to be processed by renderer.


EXTERNAL FEATURE > BOOKMARKS

Chrome Bookmarks
Don't modify the native interface.
Bookmarks can just be like an 'unprocessed list'.
Similar to 'history annotation'.
After processing them, can move to a 'processed directory'.


EXTERNAL FEATURE > SEND TO TERMINAL

From the scratch editor, send something to terminal


RENDERER > MARKDOWN FEATURES

Structural:
- headlines (h1..h6)
- ordered and unordered lists

Inline elements:
- bold, italics
- code
- keyboard / custom

Advanced elements:
- Custom plugins
- Tables

Images and annotations
- image
- image gallery
- webm/gif
- video (eg. youtube)

Code blocks
- non-lang
- lang
- filename/lang












RENDERER > ERROR PROOFING

Takes various 'blocks' and parses/renders them into HTML.
This is where all 'customization' happens.
Where markdown-it plugins come into play.

When processing, need to detect 'errors':
- open-block error: a codeblock didn't close



APP > CACHE

If there are many files, can setup a persistent lowdb storage of the AST tree.




PERSONAL WEBPAGE (code-hoarder.dev)

Sections:
- TIL: exported from knowledge system
- Projects
- Blog: exported from knolwedge system
- About

Some automation:
- Local: preview everything
- Remote: TIL, BLOG, ABOUT
- Automatically deploy every night using cron-rule
- Setup a .local extensions for the codehoarder.dev (codehoarder.local)



APP > BACKEND/FRONTEND

Backend:
- API for AST elements
- Send rendered HTML for each MD section
Frontend:
- inflate everything using API
- pre-build as a bundle




