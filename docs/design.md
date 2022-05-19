## 4 core UI components

The UI will have 4 components:
- preview drawer
- omnibar
- tree nodes
- text nodes


## Top-level tree-nodes

- youtube
	- channel
	- video
	- subvideo: name it myself
- bookmarks
	- family: stack-excange, redit, blog, medium
	- site: stack-oeverflow, subreddit, blog-url, ...
	- post: postname
- notes
	- docs: paperwork stuff
	- journal: scheduling, planning, etc.
	- game
	- insights
	- projects
- uncategorized


Bookmarks:

stack exchange:
- stack overflow
- linux and unix
- ...

reddit:
- subreddit1
- subreddit2
- subredit3

blog:
- blog-url-1
- blog-url-2



## 4-way data binding

Scrolling through text-nodes, intersection observer tracks active tree-node.
Scrolling between them can be bound/unbound.

Clicking on the tree-node may show media in the preview bar.

It may also change contents of the omnibar.


## Mouse and modifiers

Clicking on the tree-node may change the view from node-view to timeline-view.
It may also restrict/expand the node.

Shift-key will do differnet things depending on cat-node/text-node.
For text-nodes, it simply 'selects' them (shows count in omnibar).
For tree-nodes, it will trigger the 'media preview'.

Ctrl-key will also have certain custom behaviours.
It can 'focus/unfocus'.

A ctrl+shift click, may also have a special meaning.

When pressing shift on a tag -> it shows up in the omnibar.


## Intersection-observer and transitions

Scrolling through text-nodes would automatically move 'focus' on the tree-node.
The top-node fully visible in the UI becomes the 'active node'.

Could also manually 'override' 

## Tree-node asssist handlers

Handlers.
When pasting text into omnibar, it tries to 'parse' it.
Figure out whether it is a new node request, 

Omnibar will provide graphical hints on what is missing.
Eg. if a screenshot meeting for url, or if title missing for youtube.

Notifications will show success/error for API-based retrieval.

Through a URL - might be able to extract all the necessary info.
E.g.: copy the URL in the browser, paste in the omnibar.
Immedieately convert the URL into pieces.
eg. stackoverflow, reddit -> can extract a bunch of things.




## Image pasting

Paste images into omnibar.
Paste images into text-editor.
In text node, need to 'aggregate' them into the proper view.
If they are spread-out.


## Deploying on local network

Deploy the service on the local server, not on the current machine.
That means that need to have authentication mechanism in-place.

## Back/Forward actions

When changing the 'view', last selected view is saved ino history.
Can go back or forward, based on the changes in the view selection.

Changes can happen through search-bar, or through click events / shortcuts.

Easily transition from cat-view to daily-view.
Using back/forward keys, can quickly return to previous 'view'.

Allow for 'explorative analysis'.
When simply jump-around the different tags, expanding/restricting scope.

## Search and filter

Core search params:
- tree-node levels
- tags
- dates
- text
- archived

When filtering, can specify 'max-depth':
- do not descend into vids, only show channels.
- do not descent into vid markers, only shows vids

Can specify tag-'ands':
- vids with tag=engineering with marker tag=motors
  - this will only look at design 'design motors'
- will filter-out all BLDC electronics vids with motor-tag

Can search text in tree-nodes and text-nodes:
- limit text-search to tree-node titles
- search in tree-nodes AND text-nodes

Search is based on the tree-nodes.
All text-nodes will be displayed for a filtered tree-node.

When searching/filtering - show the filter in the search bar.
Simply click 'x' to cancel the filter.


An example search: all the train vids on lesics
- type:youtube
- channel:lesics
- tag:trains
- depth:none (default - full depth)

Another exmaple:
- type:notes
- text:'sed -s'
- tag:shell

Another example: find all welding vids on youtube
- type:youtube
- tag: welding
- depth:vid

Another example: find all css material on-hand
- type:none (find relevant items of all types)
- tag:css


## Uncateogorized items (text-nodes without tree-nodes)

Can have text-nodes without tree-nodes.
These are the text-nodes with null foreign_id.
They belong to the 'day'.

Cannot view them in tree-node view, since they have no associated tree-node.
They are also non-searchable - since can only search by node.

Can ONLY show them, when parent_node == null
Can IGNRORE them, when paren_node != null

They would be aggregated under the virtual-day node.

## Tree-nodes creation

Tree nodes are created through omnibar.
A paste-action into omnibar will trigger 'processing'.
Once all the 'requirements' for tree-node are satisfied, it can be created.

Plain tree-nodes are useful, without any text-annotation.
Eg. used as bookmarks, references to youtube-vids.

Tree-node tracks its creation date.
It can be used to create 'virtual text-nodes'.
E.g. timeline view, can show 'created' virtual text-node.

Tree-nodes can also be 'virtual'.
Using 'todays date' is a 'virtual' node in timeline view.


## Text-nodes creation

Text-nodes are creted by hover-action over tree-node.
Or other text-nodes belinging to a tree-node.
Like in python notebooks in VSCode.


## Hovering actions

There are multiple hover actions that can be utilied:
- archvie/delete text-node
- new text-node

Hover-actions help intuitive UI.
Shortcut-actions should also be available, but for 'expert level'.

## Tech stack 

- React as frontend framework
- React components for tree-nodes, text-nodes and omnibar
- D3 for youtube vid annotation (scaling time)
- Marked for markdown render/preview
- Monaco for text-editing
- React-query for fething data from backend
- Plyr or Iframe for youtube-vid loading
- Prisma/Sqlite and Express for backend
- Intersection observer as speed-up logic

## Tag-tree and inheritance

Tags are not inheritable.
Separate tags are applied to channel, video and sub-video.
A channel tag 'engineering' will not propagate to the video on the channel.
However can explicitly search for channel:engineering > vid:other-tag.

Tags have tree structure.
Code - bash, py, ...
Fab - 3d, weld, cnc, ...


## Application examples

Process youtube vids:
- fabrication vids: 3d-print, welding, laser, cnc
  - annotate interesting design subparts of vids
  - can group vid segments based on similar features
- engineer vids: motors and controllers
  - motors, controllers, hardware, timers, etc.
  - annotate vids, then easily reference them
- car repair vids: chrisfix, speedkar99, lesics
  - organize vids by topics: transmission, steering, etc.
- record interesting comments next to the actual vid

Process web sources:
- esk8 and motors forums
- reddit posts
- quickly preview bookmarks through screenshots

Organize notes:
- e.g. building design - will be a tag
- can have personal notes under a projct, with fixed tags