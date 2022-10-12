## Development Roadmap


NATURAL HIERARCHIES
- youtube-channel > youtube-video > youtube-segment
- stack-site > stack-post > stack-answer
- subreddit > reddit-post > reddit-comment
- forum > post > comment
- docs > topic > section
- domain > webpage > section
- blog > blogpost > section

The handlers should be able to 'facilitate' the hierarchies.
- youtube: automatically find or create channel node, add as parent
- se: automatically find parent site for post, add as parent
- forum: automatically determine whether it is a post or comment, add as parent
- docs, blog, domain: group parent/child under common domain


USE-CASES
- split up 'ingeneious kitchen items' or 'woodworking hacks' vids into sections
  each section
  then can tag 
- organize different car components from youtube vids
  differential from lesics, chris-fix, speedkar99, learn-engineering
- track house build steps using metadata
  house-steps



PARSER LOGIC
- [ ] reddit parsing is having issues - need to debug
- [ ] need to validate so/se and other stack exchange sites
- [ ] use domains to create parent/child relationship between nodes


OMNIBAR MANUAL PASTE/UPLOAD
- [ ] Paste URL into the omnibar, when under 'creation' mode.
  It will automatically become a 'history' item.
- [ ] Paste/Drop a file of history records
  Can also have a direct-file-access to chrome history file.
  Can do a one-click import of items.

OMNIBAR QUERY INTERFACE
- [ ] centalize the position on top of the page - make it part of 'both' node-list/node-view uis
- [ ] use the right-icon to indicate different modes
  can make it clickable, to 'switch' modes (e.g. query / insertion/ etc.)
- [ ] different query
  : # - search tags
  : // - search text/regex
  : @ - metadata
  : ! - directives (e.g. !history/!metadata/!tag !nonrec !namesort !1/!2/!n saved queries)
  : ^/$ - start/end date filters
  : > - tree view grouping (e.g. #youtube>#car,#mechanical,#eng>#differential,#steering)
- [ ] shortcuts to enter different modes
  ctrl+k - query mode
  ctrl+shift+k - insert mode


ROUTING
- [ ] each node activation creates a route/history
- [ ] each query/search create a route/history

NODELIST TREE VIEW
- [ ] tree-view of the item
  tags/metadata/etc. doesn't get a click handler, automatically become 'passive' items
  use the TreeNode: {title: string, item: node, children: TreeNode[] } interface
- [ ] infinite history scroll
  for history view, allow for 'infinite' scroll with cursor backing it up in the backend
- [ ] expandable node scroll
  display header + number of items, show only N items (eg. 100)
  to view other items, see-next items (basically pagination implementation)
- [ ] hide redundant icons
  instead of displaying the same 
  however can experiment with it first, and display the reduanant item

NODELIST MULTIPLE SELECTION
- [ ] multiple selection / prop modification
  can 'select' items to modify their properies
  properties: eg. select manually or highlight using query
- [ ] show a number of selected items in the omnibar

YOUTUBE PREVIEW
- [ ] youtube preview on dbl-click
  when dbl-clicking on youtube, embed video
- [ ] show video timeline with all 'segments' in it
  segments are children of the video
- [ ] can make a custom UI for video 'preview'
  download vid, extract pictures for every 5 seconds
  can make custom 'preview' for this
  can make this processing into a background process
- [ ] hold shift to create a 'finite section'
  to differentiate start from end
  snap-to marker when creating the next item
  when viewing a segment, focus on the section of the video
- [ ] can take 10-second, 5-second, 1-second images for preview
  and can still navigate frame-by-frame in the youtube vid

CUSTOM FILE INTERFACE
- [ ] pdf interface
  use subsetions of the book as children
  use pdfjs to view the pdf
- [ ] local video interface
  stream video, show preview using custom thum bnails

VIRTUAL NODES
- [ ] can create 'virtual nodes' that would
  can generate a special virtual URI for them, which would not go anywhere 

LEAFS
- [ ] sort by text vs sort by date
  by default, sort the leafs by date created
  however can sort them by title (e.g. create headlines)
  can make it local, not global - eg. make it a property in metadata


PREVIEW
- [ ] make a proper modal-popup preview for preview image/gif
- [ ] support gif insertion into preview
- [ ] setup image-cache for gallery items

ICONS
- [ ] currently instead of 120w x 60h, the 120 is being chosen 
  need to use the 'min', not the max

EDITOR
- [ ] insert gifs into editor, convert to webm

METADATA
- [ ] figure out whether key+value should be unique, or just key should be unique
  probably use unique 'key' - simply use commas to separate multiple values
- [ ] easy interface to add new keys and update values - eg. modal vs. inline 
  can have a hover 'plus' action that allows creating a new row
  until the item is 'complete', don't allow the new item to be created
- [ ] autocomplete keys and values
  when autocompleting key - use all the keys
  when autocomplet values - only use values for the key
- [ ] can use omnibar for value completion 
- [ ] show tags, dates
- [ ] parent/child tree (as a line) - show the node-line with icons from left to right
  if there are multiple children, can only show a handfull with handful of most recenet ones
- [ ] history timeline - show each 'visited' on the tiemline
  can also 'click' on it to 'jump' to the date

HISTORY/TIMELINE VIEW vs. TAG VIEW
- [ ] HISTORY/TIMELINE VIEW
  instead of a scrollbar, can use a timeline view
  show a 'date summary', make it clicable
  this way scrolling through 'virtual' space
  can click on any point, and then scroll-up/down from it
- [ ] TAG VIEW
  instead of a contiunuous scrollbar, show a number of nodes
  each node will have a number of items, that can have separate scrollbars



