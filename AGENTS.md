
Every failed tool call in this code base is noteworthy. If it happens, finish your task, but mention in your final response what went wrong and ask the user to figure out a way to avoid it next time.


## Project Structure

- `backend/` contains the Java 25 application built with Gradle. Java sources
  are under `backend/app/src/main/java/`.
- `frontend/` contains the React application built with Vite. Sources are under
  `frontend/src/`; `main.jsx` is the entry point and `App.jsx` contains the main UI.

## Code Navigation

Instead of reading files immediately, first inspect their structure via `ast-grep outline` to decide if it's worth reading.
You must use the `ast-grep-outline` skill as it contains vital information on how to use this tool best.
