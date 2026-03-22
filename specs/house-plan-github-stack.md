# Feature Spec: House Plan GitHub Stack
Date: 2026-03-21
Layer: research + backend-module + frontend + future-integration

## What We're Building
This is a reference spec for open-source GitHub projects that can support a future SiteSense workflow for:

- house concept generation
- BIM / IFC modeling
- structural analysis support
- browser-based model viewing
- quantity takeoff and engineering handoff

This spec is not saying all of these repos should be integrated now.

Its purpose is to help Claude and future sessions understand:

- which repos are worth considering
- what each repo is good for
- what is MVP-ready versus later-phase
- which tools are strongest for a startup direction

## Core Product Need

For SiteSense, the long-term need is not just "draw a house."

The product needs a stack that can eventually support:

1. simple house or parcel-fit concepts
2. 3D/BIM-ready geometry
3. structural/civil reasoning support
4. quantity takeoff
5. browser-friendly visualization
6. engineer handoff

That means the best GitHub stack is not a single repo.
It is a layered combination.

## Strong Recommendation

For the future SiteSense house-planning stack, the strongest open-source path is:

1. `FreeCAD`
2. `IfcOpenShell`
3. `Procedural-Building-Generator`
4. `XC` or `OpenSees`
5. `xeokit BIM Viewer`

This gives the best balance of:

- practical modeling
- BIM portability
- engineering seriousness
- browser visualization

## GitHub Stack by Role

### 1. House concept generation

#### Recommended: `wojtryb/Procedural-Building-Generator`

Repo:

- https://github.com/wojtryb/Procedural-Building-Generator

Why it matters:

- useful for generating floor plan and building massing logic
- strong fit for "what can I build here?" concept workflows
- good reference for procedural spatial generation

How it fits SiteSense:

- best used as an algorithm reference or optional generator layer
- not necessarily the first production dependency for a Netlify runtime

Readiness:

- `Later-phase integration`
- `Immediate inspiration/reference`

### 2. BIM / IFC backbone

#### Recommended: `IfcOpenShell/IfcOpenShell`

Repo:

- https://github.com/IfcOpenShell/IfcOpenShell

Why it matters:

- best open-source IFC / OpenBIM core
- supports BIM data, geometry, extraction, and IFC workflows
- useful for future quantity takeoff, interoperability, and engineer handoff

How it fits SiteSense:

- strongest long-term BIM foundation
- ideal when moving beyond lightweight JSON geometry into real open BIM

Readiness:

- `High-value long-term foundation`
- `Phase 2+ integration`

### 3. Parametric open CAD / BIM platform

#### Recommended: `FreeCAD/FreeCAD`

Repo:

- https://github.com/FreeCAD/FreeCAD

Why it matters:

- full open-source parametric modeler
- useful for house geometry, drawing workflows, and later FEM linkage
- broad ecosystem and strong long-term value

How it fits SiteSense:

- good platform for desktop-assisted workflows
- useful as a modeling and validation path even if the web app stays lightweight

Readiness:

- `High-value long-term foundation`
- `Not a first Netlify runtime dependency`

### 4. Structural analysis engine

#### Recommended: `xcfem/xc`

Repo:

- https://github.com/xcfem/xc

Why it matters:

- strong civil/structural analysis orientation
- useful for open-source engineering computation
- more aligned with civil engineering than many smaller hobby repos

How it fits SiteSense:

- strong candidate for structural checking, section analysis, and future engineering workflows

Readiness:

- `Advanced future integration`
- `High technical value`

#### Alternate: `OpenSees/OpenSees`

Repo:

- https://github.com/OpenSees/OpenSees

Why it matters:

- very strong research-grade structural analysis engine
- especially useful for seismic or advanced structural workflows

How it fits SiteSense:

- useful as a future computation backbone
- best treated as advanced engineering infrastructure, not immediate MVP UX

Readiness:

- `Advanced future integration`
- `Strong analysis engine`

## 5. Browser BIM viewer

### Recommended: `xeokit/xeokit-bim-viewer-app`

Repo:

- https://github.com/xeokit/xeokit-bim-viewer-app

Why it matters:

- best candidate for future browser-side BIM visualization
- useful for interactive model viewing in a product context

How it fits SiteSense:

- ideal once house concepts or IFC models need to be shown in browser
- strong fit for a future client/engineer review experience

Readiness:

- `Phase 2+ visualization layer`

## Additional Useful Repos

### IFC / BIM support

#### `xBimTeam/XbimEssentials`

- https://github.com/xBimTeam/XbimEssentials
- useful for .NET IFC workflows
- relevant if the stack ever needs a .NET-side BIM path

#### `opensourceBIM/BIMserver`

- https://github.com/opensourceBIM/BIMserver
- useful for IFC storage, collaboration, and model management
- more relevant for a mature product than a hackathon MVP

#### `ifcwebserver/ifcwebserver`

- https://github.com/ifcwebserver/ifcwebserver
- useful for querying IFC and exposing IFC content through a web service

### Conversion / import support

#### `AMostafaH/CrossBIM`

- https://github.com/AMostafaH/CrossBIM
- useful if SiteSense ever wants to convert raster or DXF plans into IFC workflows
- interesting for document-to-model or legacy-plan pipelines

### Web-based planning UX

#### Strong highlight: best browser-side 2D planner + 3D viewer reference

If the goal is specifically:

- web-based 2D floor planning
- immediate 3D viewing
- browser-first interaction

then the most relevant repo in this list is:

- `amitukind/architect3d`

This repo should be treated as:

- the best `frontend interaction reference`
- the best `browser-side planning UX reference`
- a good inspiration source for how SiteSense could eventually let users sketch or edit simple layouts in the browser

Important boundary:

- this is not the engineering-analysis backbone
- this is not the BIM/IFC backbone
- this is not the structural solver

Its strength is:

- web planning interaction
- 2D to 3D user experience
- fast concept visualization

#### `amitukind/architect3d`

- https://github.com/amitukind/architect3d
- useful as a web floor-planning reference
- best option in this list if the product needs a browser-based 2D planner with an attached 3D viewer feel
- much more UX-oriented than engineering-oriented

### Recommended interpretation for SiteSense

Use `architect3d` if the question is:

- "How should a user sketch a simple floor plan in browser?"
- "How should 2D planning connect to an immediate 3D preview?"

Do not use `architect3d` if the question is:

- "How do we do BIM interoperability?"
- "How do we do quantity takeoff?"
- "How do we do structural analysis?"

In short:

- `architect3d` = browser planning experience
- `IfcOpenShell` / `FreeCAD` = BIM and model backbone
- `XC` / `OpenSees` = structural computation

## Repos To Use Carefully

These may still be useful, but they should not be assumed production-ready without review:

- research-heavy academic generation repos
- small calculators with unclear maintenance
- repos without a clear license
- niche experiments not designed for productization

Universal caution:

- check license before integration
- check maintenance activity
- check whether the repo is a reference, a library, or a production component

## MVP Guidance

For the hackathon and near-term product:

- do not try to integrate all of these repos at once
- do not make desktop CAD/BIM tools a hard dependency for the first web flow
- use them as references for architecture and future direction

### MVP-ready mindset

In the short term:

- keep runtime logic lightweight
- generate simple concept outputs in your own backend
- use these GitHub projects as inspiration or later integration targets

### Best MVP subset

If one subset must be prioritized for learning and future compatibility, use:

1. `IfcOpenShell`
2. `FreeCAD`
3. `Procedural-Building-Generator`
4. `xeokit-bim-viewer-app`

Add `XC` or `OpenSees` only when the product is ready for deeper engineering workflows.

## Startup Direction

For the startup vision, the ideal long-term architecture is:

- lightweight web-first concept generation
- IFC-compatible model backbone
- optional desktop/open-source validation path
- browser BIM viewer
- structural/civil computation layer

This keeps the system:

- universal
- modular
- extensible
- compatible with engineer review workflows

## Files to Create or Edit

- `specs/house-plan-github-stack.md` - this spec

## Implementation Steps

1. [ ] Review licenses for the shortlisted repos before integration
2. [ ] Decide which repos are reference-only versus integration candidates
3. [ ] Pick one BIM backbone strategy: IFC-first or lightweight custom geometry first
4. [ ] Pick one future viewer strategy: xeokit or custom lightweight viewer
5. [ ] Decide when structural engine integration becomes worth the complexity

## Success Criteria

- Claude can understand which GitHub tools are most relevant to house planning for civil/architectural workflows
- future sessions can distinguish MVP-friendly tools from later-phase tools
- SiteSense keeps a practical path toward house planning, BIM, and engineer handoff without overcommitting too early
