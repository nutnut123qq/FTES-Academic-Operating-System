## ADDED Requirements

### Requirement: Frontend can create a group
The frontend SHALL provide a typed REST call and SWR mutation hook that creates a new group.

#### Scenario: Create group
- **WHEN** the authenticated user submits a `GroupCreateGroupRequest`
- **THEN** the system calls `POST /api/v1/groups` and returns `GroupResponse`

### Requirement: Frontend can read a group
The frontend SHALL provide a typed REST call and SWR query hook that reads a group by id or slug.

#### Scenario: Get group
- **WHEN** the authenticated user requests a group by id or slug
- **THEN** the system calls `GET /api/v1/groups/{idOrSlug}` and returns `GroupResponse`

### Requirement: Frontend can discover groups
The frontend SHALL provide a typed REST call and SWR query hook that lists/discovers groups with optional filters and cursor pagination.

#### Scenario: Discover groups
- **WHEN** the authenticated user requests a group list with optional type, campus, query, cursor, and limit
- **THEN** the system calls `GET /api/v1/groups?type={type}&campus={campus}&q={q}&cursor={cursor}&limit={limit}` and returns `GroupPage<GroupResponse>`

### Requirement: Frontend can read a group feed
The frontend SHALL provide a typed REST call and SWR query hook that returns a group's post feed.

#### Scenario: Get group feed
- **WHEN** the authenticated user requests the feed for a group id
- **THEN** the system calls `GET /api/v1/groups/{id}/feed?cursor={cursor}&limit={limit}` and returns `GroupFeedSlice`

### Requirement: Frontend can update a group
The frontend SHALL provide a typed REST call and SWR mutation hook that updates a group.

#### Scenario: Update group
- **WHEN** the authenticated user submits a `GroupUpdateGroupRequest` for a group id
- **THEN** the system calls `PATCH /api/v1/groups/{id}` and returns `GroupResponse`

### Requirement: Frontend can archive a group
The frontend SHALL provide a typed REST call and SWR mutation hook that archives a group.

#### Scenario: Archive group
- **WHEN** the authenticated user archives a group id
- **THEN** the system calls `POST /api/v1/groups/{id}/archive` and returns void

### Requirement: Frontend can join a group
The frontend SHALL provide a typed REST call and SWR mutation hook that requests to join a group.

#### Scenario: Join group
- **WHEN** the authenticated user submits an optional `GroupJoinRequestDto`
- **THEN** the system calls `POST /api/v1/groups/{id}/join` and returns `GroupJoinResult`

### Requirement: Frontend can list join requests
The frontend SHALL provide a typed REST call and SWR query hook that lists a group's join requests.

#### Scenario: List join requests
- **WHEN** the authenticated user requests join requests for a group id
- **THEN** the system calls `GET /api/v1/groups/{id}/join-requests?status={status}&limit={limit}` and returns `GroupJoinRequest[]`

### Requirement: Frontend can decide a join request
The frontend SHALL provide a typed REST call and SWR mutation hook that approves/rejects a join request.

#### Scenario: Decide join request
- **WHEN** the authenticated user submits a `GroupDecisionRequest` for a request id
- **THEN** the system calls `POST /api/v1/groups/{id}/join-requests/{reqId}/decision` and returns void

### Requirement: Frontend can invite a user to a group
The frontend SHALL provide a typed REST call and SWR mutation hook that invites a user.

#### Scenario: Invite user
- **WHEN** the authenticated user submits a `GroupInviteRequest`
- **THEN** the system calls `POST /api/v1/groups/{id}/invitations` and returns the invitation id as a string

### Requirement: Frontend can respond to an invitation
The frontend SHALL provide a typed REST call and SWR mutation hook that accepts/declines an invitation.

#### Scenario: Respond to invitation
- **WHEN** the authenticated user submits a `GroupRespondInviteRequest` for an invitation id
- **THEN** the system calls `POST /api/v1/invitations/{id}/respond` and returns void

### Requirement: Frontend can list group members
The frontend SHALL provide a typed REST call and SWR query hook that returns group members.

#### Scenario: List members
- **WHEN** the authenticated user requests members for a group id
- **THEN** the system calls `GET /api/v1/groups/{id}/members?role={role}&limit={limit}` and returns `GroupMember[]`

### Requirement: Frontend can change a member role
The frontend SHALL provide a typed REST call and SWR mutation hook that changes a member's role.

#### Scenario: Change role
- **WHEN** the authenticated user submits a `GroupRoleChangeRequest` for a member
- **THEN** the system calls `PATCH /api/v1/groups/{id}/members/{userId}` and returns void

### Requirement: Frontend can remove a member
The frontend SHALL provide a typed REST call and SWR mutation hook that removes/kicks a member.

#### Scenario: Remove member
- **WHEN** the authenticated user removes a member from a group
- **THEN** the system calls `DELETE /api/v1/groups/{id}/members/{userId}` and returns void

### Requirement: Frontend can transfer group ownership
The frontend SHALL provide a typed REST call and SWR mutation hook that transfers ownership.

#### Scenario: Transfer ownership
- **WHEN** the authenticated user submits a `GroupTransferOwnershipRequest`
- **THEN** the system calls `POST /api/v1/groups/{id}/transfer-ownership` and returns void

### Requirement: Frontend can create an announcement
The frontend SHALL provide a typed REST call and SWR mutation hook that creates a group announcement.

#### Scenario: Create announcement
- **WHEN** the authenticated user submits a `GroupAnnouncementRequest`
- **THEN** the system calls `POST /api/v1/groups/{id}/announcements` and returns `GroupAnnouncement`

### Requirement: Frontend can update an announcement
The frontend SHALL provide a typed REST call and SWR mutation hook that updates a group announcement.

#### Scenario: Update announcement
- **WHEN** the authenticated user submits a `GroupAnnouncementUpdateRequest`
- **THEN** the system calls `PATCH /api/v1/groups/{id}/announcements/{announcementId}` and returns `GroupAnnouncement`

### Requirement: Frontend can delete an announcement
The frontend SHALL provide a typed REST call and SWR mutation hook that deletes a group announcement.

#### Scenario: Delete announcement
- **WHEN** the authenticated user deletes an announcement
- **THEN** the system calls `DELETE /api/v1/groups/{id}/announcements/{announcementId}` and returns void

### Requirement: Frontend can list announcements
The frontend SHALL provide a typed REST call and SWR query hook that lists group announcements.

#### Scenario: List announcements
- **WHEN** the authenticated user requests announcements for a group id
- **THEN** the system calls `GET /api/v1/groups/{id}/announcements?limit={limit}` and returns `GroupAnnouncement[]`

### Requirement: Frontend can pin a post
The frontend SHALL provide a typed REST call and SWR mutation hook that pins a post in a group.

#### Scenario: Pin post
- **WHEN** the authenticated user pins a post id in a group
- **THEN** the system calls `PUT /api/v1/groups/{id}/pinned-posts/{postId}` and returns void

### Requirement: Frontend can unpin a post
The frontend SHALL provide a typed REST call and SWR mutation hook that unpins a post in a group.

#### Scenario: Unpin post
- **WHEN** the authenticated user unpins a post id in a group
- **THEN** the system calls `DELETE /api/v1/groups/{id}/pinned-posts/{postId}` and returns void

### Requirement: Frontend can list pinned posts
The frontend SHALL provide a typed REST call and SWR query hook that lists pinned posts.

#### Scenario: List pinned posts
- **WHEN** the authenticated user requests pinned posts for a group id
- **THEN** the system calls `GET /api/v1/groups/{id}/pinned-posts` and returns `GroupPostSummary[]`

### Requirement: Frontend can link a resource
The frontend SHALL provide a typed REST call and SWR mutation hook that links a resource to a group with an optional note.

#### Scenario: Link resource
- **WHEN** the authenticated user submits a `GroupResourceNote` for a resource
- **THEN** the system calls `PUT /api/v1/groups/{id}/resources/{resourceId}` and returns void

### Requirement: Frontend can unlink a resource
The frontend SHALL provide a typed REST call and SWR mutation hook that unlinks a resource from a group.

#### Scenario: Unlink resource
- **WHEN** the authenticated user unlinks a resource id from a group
- **THEN** the system calls `DELETE /api/v1/groups/{id}/resources/{resourceId}` and returns void

### Requirement: Frontend can list linked resources
The frontend SHALL provide a typed REST call and SWR query hook that lists resources linked to a group.

#### Scenario: List resources
- **WHEN** the authenticated user requests resources for a group id
- **THEN** the system calls `GET /api/v1/groups/{id}/resources` and returns `GroupResourceLink[]`

### Requirement: Group DTOs are typed
The frontend SHALL expose TypeScript types for all request and response shapes, prefixed with `Group*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the group REST module
- **THEN** they receive prefixed types such as `GroupResponse`, `GroupCreateGroupRequest`, `GroupUpdateGroupRequest`, `GroupMember`, `GroupAnnouncement`, `GroupInvitationRequest`, `GroupJoinRequestDto`, `GroupDecisionRequest`, `GroupRespondInviteRequest`, `GroupRoleChangeRequest`, `GroupTransferOwnershipRequest`, `GroupResourceNote`, `GroupResourceLink`, `GroupFeedSlice`, and `GroupPostSummary` matching the backend `GroupDtos` and `CommunityApi` records
