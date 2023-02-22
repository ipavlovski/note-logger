# FEATURE LIST

CATEGORIES:
- tags can be attached to 'categories' and propagate recursively
- can have helper methods for creation of categories
- categories can be given a URI (linkification)
  remote (web, youtube) or local (eg. pdf, local-files) - should be able to open in browser

TOC
- TOC is represenative of the current tree
  it will also have its own 'scroll'
- TOC will be linked via intersection observer to the content
- can drag-and-drop entry (using circle) to into TOC to attach assign category
- always fully-loaded in memory (proper scrollbar always)

Note on TOC:
Can add title to it... 

TREE VIEW
- uncategorized items get attached directly to the 'bottom' 
- tree-view is managed through 'windowing' (unlike TOC which is fully loaded)
- would utilize a 'windowed' interface to improve performance

CUSTOM ORDER
- under 'category root' -> can assign order to the item
- order is always relative to the category
  switching categories changes order to -1 (show 'at the end')
- always do 2 order sequences -> sort by order then by date
- can use 'created-or-updated' filter for sorting (default view flag)

QUERYING:
- #tag
- /search, //titles
- @ category root > other caetgoy, @> null category (filter by category)
- $2012-12-11$2012-12-14, $2012-12-11, $2012-13-14$, $3w, $2014-13$3w, $3w$2012-12-14
- can use negative filters (eg. !#tag, !>category, !$ date)
- can use null filters (@null, #null, //null)
- use metadata filters (eg. field/value), fields can be a dotted spec (var1.subvar2)

Note about queries: no 'simple' way to display a list of all 'car creators'
eg. chrisfix, speedkar99, ...
Searching only by entires.

Note about 'querying existing': the current 'query' is up there.
Always display the current query: eg. default - 3w 
Reflect the query in the URLbar
When clicking/selecting item - also reflect hat

EDITS
- edits are atomic -> editor represents current state 'in the browser'
  to actually save to the server -> need to press 'escape'
  if there is an issue with markdown -> will not let press 'escape'
- can only edit one entry at a time, will not allow editing previous, while current is 'active'
- new entries automatically reset all of their metadata
- editor box is always open, fixed-height
- a 'new' edit generates the preview 'at the bottom' (unattached)
- in caes of editing under a filter, will still show the preview at the bottom
  IF can't match it to the view (not just 'untagged')
- can use ctrl+e to 'edit last' -> can adjust the tags inline, so it pops up into place
- can also assign tags, so it is editing 'in the right place'
- shortcuts (e.g. recenter preview)

PREVIEW:
- depending on directive, can do previews -> may need to use 'selections'

FILES
- 1-many vs. many-many relationship?
- a pdf, icon, screenshot -> can be referenced many times, so many-to-many

