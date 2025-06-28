# Build Version Control System

## Overview

The Build Version Control System automatically tracks changes to your builds, creating versions every time a build is updated. This allows you to view, restore, and manage different iterations of your game.

## Features

### Automatic Version Creation
- **Build Updates**: A new version is automatically created every time you update your build through the chat interface
- **Title Changes**: Versions are also created when you change the build title
- **Version Restoration**: When you restore from a previous version, a new version is created of the current state before restoration

### Version Management
- **View Versions**: See all versions of your build in the left sidebar
- **Restore Versions**: Click the restore button to revert your build to any previous version
- **Delete Versions**: Remove versions you no longer need
- **Collapsible Sidebar**: Collapse the versions panel to save screen space

## User Interface

### Versions Sidebar
Located to the left of the chat interface, the versions sidebar shows:
- **Version Number**: Each version is numbered sequentially (v1, v2, v3, etc.)
- **Title**: The title of the build at that version
- **Timestamp**: When the version was created (e.g., "2 hours ago")
- **Description**: Automatic description of why the version was created

### Controls
- **Refresh Button**: Manually refresh the versions list
- **Collapse/Expand**: Toggle the sidebar visibility
- **Restore Button**: Revert to a specific version (green arrow icon)
- **Delete Button**: Remove a version permanently (red trash icon)

## API Endpoints

### Get Build Versions
```
GET /api/builds/[id]/versions
```
Returns all versions for a specific build, ordered by version number (newest first).

### Get Specific Version
```
GET /api/builds/[id]/versions/[versionId]
```
Returns details for a specific version.

### Delete Version
```
DELETE /api/builds/[id]/versions/[versionId]
```
Permanently deletes a version. This action cannot be undone.

### Restore Version
```
POST /api/builds/[id]/versions/[versionId]/restore
```
Restores the build to the specified version. Creates a new version of the current state before restoration.

## Database Schema

### build_versions Table
```sql
CREATE TABLE build_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by_fid BIGINT NOT NULL,
  description TEXT DEFAULT '',
  
  UNIQUE(build_id, version_number)
);
```

## Implementation Details

### Automatic Version Creation
Versions are automatically created in these scenarios:

1. **Build Content Update** (via `/api/update-build`)
   - Triggered when AI updates the build through chat
   - Creates version before applying new changes

2. **Title Update** (via `/api/builds/[id]/title`)
   - Triggered when user changes the build title
   - Creates version before applying title change

3. **Version Restoration** (via `/api/builds/[id]/versions/[versionId]/restore`)
   - Creates version of current state before restoring
   - Allows "undo" of restoration if needed

### Version Numbering
- Version numbers start at 1 and increment sequentially
- Uses database function `get_next_version_number()` to ensure consistency
- Version numbers are unique per build

### State Management
- React hook `useVersions()` manages version state
- Automatically refreshes when builds are updated
- Optimistic updates for better UX (immediate UI feedback)

### Error Handling
- Graceful fallback if version operations fail
- User-friendly error messages via toast notifications
- Confirmation dialogs for destructive actions (delete, restore)

## Best Practices

### For Users
1. **Review Before Deleting**: Deleted versions cannot be recovered
2. **Use Descriptive Titles**: This helps identify versions later
3. **Regular Cleanup**: Delete old versions you no longer need to keep the list manageable

### For Developers
1. **Transaction Safety**: Version creation and build updates should be atomic
2. **Error Recovery**: Always handle version creation failures gracefully
3. **Performance**: Versions list is paginated for builds with many versions
4. **Security**: Ensure users can only access versions for builds they own

## Troubleshooting

### Common Issues

**Versions Not Appearing**
- Check if the build ID is correct
- Ensure the user has permission to access the build
- Try refreshing the versions list manually

**Restore Failing**
- Verify the version still exists
- Check if the build is currently being processed
- Ensure sufficient permissions

**Performance Issues**
- Consider implementing pagination for builds with many versions
- Clean up old versions periodically
- Monitor database performance with large version histories