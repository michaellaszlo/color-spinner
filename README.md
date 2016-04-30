# Color Spinner


## What is this supposed to be?

It's a web-based color picker. The visual color selector is not
present in the current version because I am concentrating on name
conversion and palette management. You can check out an earlier
version to see my implementation of the classic hexagonal color
layout. The new visual selector will be an improved version of the
hexagonal approach.

I'm working on a swatch manager that lets you group colors and move
them around a grid so that you can more easily compare and refine
shades. I also have a direct input box that parses colors in
hexadecimal format. I'll work on parsing other name formats once
the swatch manager is in serviceable shape.


## What's working right now?

Currently you can input a 32-bit RGB color as a three-character or
six-character hexadecimal code with or without a leading [hash
character](https://en.wikipedia.org/wiki/Number_sign).

For example, any of the following can be entered to specify the
color that is also known as rgb(255, 170, 187):

```
fab
#fab
ffaabb
#ffaabb
```


## What else can I do?

After entering a hex code, you can edit it in the input box. You'll
see instant updates to the active color swatch, which is in the top
left corner of the swatch manager. If you click on the active color,
it gets cloned to a new swatch.

The only other thing you can do is reload the page to see four new
random colors, which might be interesting if you're trying to come
up with a new color palette for a design project.


## What's coming next?

I'm going to refine the swatch manager by adding the ability to
hover over any swatch and choose one of the following actions:

- copy this color to the active editing area
- delete this color
- grab and move this color

After that the next priority is the visual color selector. I'm going
to bring back the hexagonal layout and add a zooming feature to
enable fine-grained color exploration.


