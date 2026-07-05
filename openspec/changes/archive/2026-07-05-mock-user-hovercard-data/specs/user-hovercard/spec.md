## MODIFIED Requirements

### Requirement: Lazy fetch profile với payload tối thiểu
`UserHovercard` SHALL KHÔNG fetch dữ liệu user khi render tĩnh. `useQueryUserHovercardSwr(username)` SHALL chỉ được kích hoạt khi hovercard đang mở hoặc đang trong delay mở. Query SHALL chỉ yêu cầu các field cần thiết cho card: `id`, `username`, `displayName`, `bio`, `avatar`, `followerCount`, `followingCount`, `isFollowedByMe`. Dữ liệu SHALL được cache bằng SWR theo username. Trong môi trường demo/local, fetcher SHALL trả về mock `UserHovercardData` thay vì gọi Apollo backend.

#### Scenario: Hover lần đầu trong demo
- **WHEN** user hover vào một user lần đầu trên local/demo
- **THEN** hook trả về mock profile với đầy đủ field mà không gọi backend

#### Scenario: Hover lại sau khi đã fetch
- **WHEN** user hover lại cùng một user
- **THEN** hệ thống KHÔNG gọi fetcher mới mà dùng dữ liệu đã cache
