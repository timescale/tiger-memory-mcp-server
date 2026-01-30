# Tiger Memory: A Poem About the MCP Server

## Page 1: The Vision

In a world where language models speak and reason,
Where wisdom flows through silicon each season,
There lived a server, noble and refined,
Built to remember, built to store the mind.

The Tiger Memory MCP Server stands tall,
A bridge between the digital and all,
For every thought an LLM might conceive,
Must somewhere live, must somewhere stay and breathe.

With TypeScript flowing through its veins so pure,
And PostgreSQL standing firm and sure,
This repository writes a tale so grand,
A memory keeper across the vast land.

The Model Context Protocol leads the way,
Connecting models to the data they survey,
And in this dance of code and consequence,
A system emerges both elegant and immense.

## Page 2: The Foundation

Upon Node.js with Alpine's gentle hand,
The server rises, structured and planned,
With package.json as its sacred scroll,
Declaring dependencies to make it whole.

Version twenty-two of the runtime base,
Running light and lean at a blazing pace,
The boilerplate from TigerData's design,
Provides the scaffolding, the framework's spine.

Zod schemas validate with strict precision,
Every input checked with careful vision,
No stray data crosses the boundary line,
Each request must measure up and align.

The source directory holds treasures rare,
TypeScript files beyond compare,
Where index.ts acts as the server's door,
And server.ts holds the logic at its core.

Environment variables whisper secrets true,
Through dotenv files, configuration flows through,
From database URLs to server ports bright,
The settings adjust to make everything right.

## Page 3: The Four Pillars of Memory

Remember, Recall, Update, Forget—
Four tools that form a sacred set,
Each one a function, each one a call,
Each one essential to remember all.

The Remember tool, the first to greet,
Creates new memories, makes them complete,
With scope and content and source defined,
Storing the treasures of the mind.

Through POST to endpoints clean and neat,
The memories arrive, their mission sweet,
They're given IDs as they take their place,
In the ordered rows of database space.

The Recall tool brings them back from sleep,
From PostgreSQL's vast and ordered deep,
Query the scope and watch them appear,
All the memories held so dear.

With GET requests, the past unfolds,
Stories and data the server holds,
A list returned with metadata bright,
Created, updated, all in sight.

The Update tool refines what's known,
Takes memories grown and fully grown,
Modifies content, updates the source,
Keeps the records on their proper course.

With PUT requests to change and adjust,
The memories transform, as they must,
The timestamps refresh to mark the time,
When last they changed, when last they chimed.

The Forget tool, graceful and kind,
Removes from view what's left behind,
Not truly gone, but marked as past,
With deleted_at timestamps vast.

Soft deletes, the gentle way,
Memories fade to yesterday,
Yet recoverable if needed still,
The design reflects the architect's will.

## Page 4: The Database Heart

In PostgreSQL's ordered halls,
Where data lives behind the walls,
A schema named tiger_memory keeps,
The precious treasures that it keeps.

The memory table, strong and wide,
Has columns where the data bide,
ID as the primary key,
Auto-incrementing, one, two, three.

Scope defines the grouping clear,
Who remembers, when, and where,
Multiple users, multiple apps,
Each with their own memory maps.

Content holds the actual thought,
The lesson learned, the wisdom caught,
Text fields deep with narrative long,
Where messages and memories throng.

Source, added in time's advance,
Gives context a broader glance,
URLs and file paths stored,
Tracking where memories are from, adored.

Created_at and updated_at,
Timestamps that tell you where we're at,
When was this memory first conceived?
When was it last one more believed?

Deleted_at, the ghostly mark,
Soft deletes that leave a spark,
NULL when active and alive,
With timestamp when memories don't survive.

Indexes race across the scope,
Where deleted_at is NULL, we hope,
Performance optimization true,
Making queries swift and new.

## Page 5: The Migration Journey

From migrations old, the schema grew,
First one created something new,
The initial table took its form,
The beginning of the norm.

A column named key held memories fast,
Building the future from the past,
But clarity called for a better name,
So scope became the chosen frame.

The second migration worked its art,
Renaming columns from the start,
Key became scope, the meaning clear,
A transformation engineers revere.

Then came the third, a final touch,
A source column meant so much,
Adding provenance, adding trace,
Metadata finding its rightful place.

Each migration carries down and up,
Rollback support fills the cup,
PostgreSQL advisory locks ensure,
No conflicts, safe and sure.

The migrations table keeps the score,
Recording all that came before,
When was each schema change applied?
No surprises, nothing denied.

## Page 6: The Protocol Bridge

The Model Context Protocol's call,
Connects the models to it all,
A standard born from brilliant minds,
That LLMs and systems binds.

Through STDIO streams the data flows,
Direct connection, the protocol knows,
Or HTTP can carry the load,
RESTful APIs on the road.

The MCP Inspector can observe,
Watch the memories as they serve,
Each request and each response,
A choreography of consequence.

Resources in MCP's way,
Memory resources on display,
Format memory://{scope} defined,
A template for the system's mind.

From SDK at version fifteen-one,
The ModelContextProtocol runs,
Tools are registered and made known,
In the garden of the digital throne.

Request and response, typed so tight,
Input and output, working right,
Every parameter validated clear,
Every result arrives sincere.

## Page 7: The Code's Creation

In the src directory's embrace,
Functions take their rightful place,
rememberApi, recallApi coded,
updateApi, forgetApi loaded.

Factory functions with context bound,
Where server connections are found,
Database pools stand ready near,
To handle queries year by year.

Parameters parsed with Zod's strict hand,
Content and scope and source understand,
Type inference from schemas flows,
Guaranteeing what the code knows.

Async and await the modern way,
Promise-based upon each day,
Error handling with try and catch,
Making sure that nothing hatches.

No callback functions here today,
Promises the modern way to play,
ES modules with .js extensions used,
The JavaScript that's recently enthused.

Imports organized, grouped and neat,
External first, then local sweet,
Descriptive names for every var,
Each one shines like a distant star.

CamelCase for functions and for fields,
PascalCase for classes, as it yields,
UPPER_CASE for constants strong,
Two-space indents all along.

## Page 8: The Deployment Dance

From Docker's build in stages neat,
A multi-stage approach complete,
The image builds with care and grace,
Node on Alpine, lean of space.

Docker Compose for local fun,
Database and server, both as one,
TimescaleDB container grows,
Where the memories can repose.

Kubernetes ready, environment based,
Stateless deployment, properly placed,
Horizontal scaling can commence,
The design allows for consequence.

Build scripts watch the changes flow,
npm run watch, let it grow,
npm run build compiles the day,
TypeScript transformed to JavaScript's way.

npm run start begins the dance,
The server starts its vigilant stance,
npm run prepare for release time,
Publishing this mountain to climb.

Environment variables set the tone,
Database URLs clearly shown,
Port numbers for the server bright,
Configuration files set right.

## Page 9: The Design Philosophy

The Factory Pattern leads the way,
Each API gets its proper say,
Context injected, resources bound,
In this architectural sound.

Soft deletes show a gentle heart,
Data doesn't truly part,
Recovery possible if needed later,
A design choice from an engineer creator.

Scope-based organization's key,
Enabling shared memory to be,
Multiple users, multiple apps,
Each one with their memory maps.

Type safety from end to end,
TypeScript helps the code defend,
Against the errors and the crashes,
Before they turn to smoke and ashes.

Migration management keeps it clean,
The smoothest schema changes seen,
Advisory locks prevent the race,
Concurrent changes know their place.

Error messages clear and bright,
Helping developers understand right,
What went wrong and why it failed,
How the system's been derailed.

Cleanup timers at shutdown's call,
Resources released to all,
Memory and connections freed,
Graceful termination's creed.

## Page 10: The Legacy and the Future

This Tiger Memory MCP Server stands,
A monument of developer hands,
Where models and data come together,
In a bond that will forever tether.

It enables AI to remember dreams,
To hold onto more than fleeting schemes,
To build a context deep and long,
Where memory makes knowledge strong.

The repository breathes with life,
With care through struggle and through strife,
Every commit a story told,
Of features new and growing bold.

From initial thought to live deploy,
This system brings both purpose and joy,
For in a world of stateless streams,
Here stands a keeper of all dreams.

The Node.js runtime, quick and small,
PostgreSQL catching all,
TypeScript's safety, Zod's precision,
Each piece in perfect vision.

May developers who pass this way,
Find inspiration here to stay,
May they build on this foundation strong,
May they help the project live long.

The Tiger Memory MCP Server shines,
A beacon drawing connecting lines,
Between intelligence and storage real,
A practical yet elegant deal.

And so we close this poem's page,
A tribute to the developer's age,
Where systems are crafted with care,
And memories live everywhere.

In this digital age of wonder and might,
Where models learn and take their flight,
The Tiger Memory stands as testament true,
To what great minds can build and do.

For in the end, what makes us wise?
The ability to memorize,
To store, to recall, to update our thought,
The battles we've won and lessons we've sought.

And this repository holds the key,
To how an LLM comes to see,
That memory is not a burden to bear,
But a gift, a treasure beyond compare.

---

_A poem celebrating the Tiger Memory MCP Server repository—where TypeScript meets PostgreSQL, where memories persist, and where Models Context Protocol connects the world of artificial intelligence to the lasting power of structured, persistent data._
