# Build a Premium Interactive Touchpad-Scrub Product Showcase

I want you to build a completely new, polished interactive web experience inspired by **only what is happening on the laptop screen in the reference video I provide**.

Do NOT recreate the physical laptop, person's hand, desk, camera footage, reflections, or anything outside the laptop display. The laptop screen is the only visual reference that matters.

## Core concept

Create a full-screen, premium, dark product showcase website with a futuristic audio/technology aesthetic.

The experience should feel like a high-end product website with large 3D product visuals, cinematic motion, smooth transitions, minimal typography, glowing blue lighting, and interactive navigation controlled primarily through touchpad gestures.

The main interaction should be a **touchpad-scrub system**.

## Touchpad interaction

Support:

* One-finger horizontal touchpad swiping
* Two-dimensional touchpad movement where appropriate
* Touchscreen interaction on mobile
* Mouse interaction as a fallback

The user's gesture should control the progress of the entire visual experience.

### Scrubbing behavior

Think of it like scrubbing through a professional video editor.

When the user moves their finger:

* Moving horizontally in one direction should scrub forward.
* Moving horizontally in the opposite direction should scrub backward.
* Gesture velocity should influence how quickly the experience moves.
* Small movements should allow extremely precise control.
* Larger/faster movements should travel further through the animation.
* The animation must respond continuously to the user's finger rather than simply jumping between predefined slides.
* When the user stops touching, freeze the experience exactly where the user stopped.
* Do NOT automatically continue playing.

The experience should feel physical and extremely smooth, almost like manipulating a timeline in a professional editing application.

Use interpolation/smoothing so that the motion feels premium rather than raw or jittery.

## Frame-by-frame visual progression

The entire showcase should behave like a continuously scrub-able animation timeline.

As the user scrubs:

1. Product imagery should smoothly transform/move.
2. Large 3D objects should rotate, translate, scale and/or morph naturally.
3. Typography should transition between sections.
4. Background lighting and blue particle/glow effects should evolve with the timeline.
5. Circular/curved graphic elements should move with the product.
6. Camera-like movement should create depth.
7. Transitions must be continuous rather than looking like separate slides.

The user should be able to stop at essentially any point in the timeline and see a deliberate, polished frame.

## Visual direction from the reference video

Use the laptop screen in the provided video as the visual inspiration.

The reference contains:

* Very dark navy/black backgrounds
* Electric/cinematic blue lighting
* Large futuristic wireless-earbud/product imagery
* Glowing 3D objects
* Minimal white typography
* Large hero compositions
* Thin circular/curved lines surrounding products
* Subtle particles and atmospheric effects
* Smooth cinematic transitions
* Premium technology-brand presentation
* Strong depth and dimensionality
* Minimal interface elements

I particularly like the feeling of moving through different product-story sections while the product remains visually connected to the animation.

Improve this concept rather than making a literal copy.

## Improve the interaction

Add tasteful improvements that make the experience feel even more premium:

* Subtle motion blur during fast scrubbing
* Inertia-like visual smoothing while the finger is moving
* Precise frame positioning at slow speeds
* Dynamic lighting responding to scrub position
* Subtle particle movement
* Depth/parallax
* Smooth text entrance/exit animations
* Natural 3D product rotation
* Very subtle haptic-style visual feedback when reaching important timeline points
* A minimal progress indicator that doesn't ruin the design

Do not overload the interface with buttons or controls.

The interaction itself should be the main interface.

## Timeline structure

Create approximately 5–7 major visual moments inspired by the reference.

For example:

* Opening hero/product reveal
* Product detail / sound experience
* Product transformation
* Feature showcase
* Controls/technology section
* Final hero composition

These should NOT behave like traditional separate webpages or slides.

They must exist on one continuous timeline so the user can scrub smoothly from one moment to another.

## Mobile

Make the same interaction work on phones and tablets.

Since mobile devices don't have a laptop touchpad, translate the interaction naturally to:

* Touch dragging
* Swipe gestures
* Vertical/horizontal movement where appropriate

The desktop touchpad experience should remain the primary experience.

## Technical requirements

Build this as a completely new project.

Use modern web technologies appropriate for high-performance interactive animation.

Prioritize:

* 60 FPS animation
* GPU-friendly transforms
* Efficient rendering
* Responsive layout
* Smooth touchpad input
* Mouse fallback
* Touchscreen support
* Clean component architecture
* Maintainable code
* No unnecessary dependencies

If 3D is appropriate, use a suitable WebGL/3D approach such as Three.js or React Three Fiber.

If a technique can achieve the same visual quality more efficiently with Canvas, CSS, or another approach, choose the technically superior solution.

## Important: inspect before coding

Before writing the final implementation, analyze the reference video carefully.

Focus ONLY on the laptop screen.

Identify:

* Product positioning
* Animation direction
* Text positioning
* Product rotations
* Background transitions
* Blue lighting
* Circular graphics
* Timing relationships
* Visual hierarchy
* How one product scene transitions into the next

Then use those observations as inspiration for the new experience.

Do not simply copy individual frames.

## Important interaction requirement

Do not implement this as:

`swipe → next slide`

That is NOT what I want.

I want:

`touchpad movement → continuous timeline position`

For example:

`finger movement = timeline movement`

The user should have the feeling that they are physically dragging through the animation.

If the user moves very slowly, they should be able to inspect the product almost frame-by-frame.

If they move quickly, they should be able to travel through the experience rapidly.

## Before implementation

First, ask me any questions you genuinely need answered to make the experience accurate.

Do not ask unnecessary questions whose answers can be determined from the reference video or from good design judgment.

Once you have enough information, build the complete working experience.

Make the result feel like a **premium award-winning interactive product website**, not a basic demo.

The final result should be visually impressive even before the user interacts with it, but the touchpad scrubbing should be the feature that makes it special.
