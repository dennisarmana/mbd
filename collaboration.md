# MBD Hackathon Team Collaboration Guide

## Team Structure

Our team consists of 4 members working on the Make Better Decisions (MBD) project during a 10-hour hackathon:

- **Oskar**: Code development
- **Anas**: Code development
- **Dennis**: Data creation and general support
- **Theo**: Data creation and general support

## Workflow Guidelines

### Kanban Board

We are using a Kanban board to track our progress. The board is located at `MBD/kanban.md` and has the following columns:
- **Backlog**: Future tasks not yet ready to be worked on
- **Todo**: Ready to be worked on
- **Doing**: Currently in progress (WIP limit: 2)
- **Done**: Completed tasks

**Important**: We have a WIP limit of 2 tasks in the "Doing" column. Before starting a new task, ensure that you either complete a current task or move it back to "Todo" if it needs to be paused.

### Git Workflow

1. **Pull before you start working**:
   ```
   git pull origin main
   ```

2. **Create a branch for your task** (recommended for larger changes):
   ```
   git checkout -b <your-name>/<feature-name>
   ```
   Example: `git checkout -b anas/chat-interface`

3. **Commit frequently with clear messages**:
   ```
   git add <files>
   git commit -m "Brief description of what you did"
   ```

4. **Push your changes**:
   - If working on main branch:
     ```
     git push origin main
     ```
   - If working on a feature branch:
     ```
     git push origin <your-branch-name>
     ```

5. **Merge branches** (if you created a feature branch):
   ```
   git checkout main
   git pull origin main
   git merge <your-branch-name>
   git push origin main
   ```

### Conflict Resolution

1. If git reports merge conflicts, don't panic!
2. Open the conflicted files and look for markers like `<<<<<<< HEAD`, `=======`, and `>>>>>>> branch-name`
3. Edit the file to resolve the conflict, removing the markers
4. After resolving, add and commit the files
5. If you're unsure, ask a teammate for help

## Communication

- Update the kanban board whenever you start or complete a task
- Communicate significant changes to the team
- If you're stuck, ask for help early rather than later
- Regularly check in with teammates to avoid duplicate work

## Project Structure

- **Frontend**: Web-based chat interface with responsive design
- **Backend**: Email ingestion, data extraction, and task recommendation
- **Data**: Mock email chains and structured organizational data

## Using Windsurf Cascade

- Each team member can use their own Windsurf Cascade instance
- Inform Cascade about this collaboration guide at the start of your session
- You can ask Cascade to help with git operations, code implementation, or data creation
- Ensure Cascade understands the WIP limit and team structure

## Hackathon Timeline

- Total duration: 10 hours
- Prioritize core functionality over additional features
- Plan for a final integration phase before the end

Remember, this is a hackathon - focus on producing a functional MVP rather than perfect code. Good luck, team!
