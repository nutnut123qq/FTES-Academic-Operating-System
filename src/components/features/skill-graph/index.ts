export * from "./SkillsByDomain"
export * from "./SkillGraph"

// Tên `SkillGraph` là API công khai của feature (profile + subject workspace đang mount
// theo tên này), nhưng mặt tiền nay là bảng kỹ năng theo nhóm nghề chứ không còn là đồ
// thị — đồ thị lùi về tab "Sơ đồ" bên trong. Giữ alias để không phải sửa nơi mount.
export { SkillsByDomain as SkillGraph } from "./SkillsByDomain"
export type { SkillsByDomainProps as SkillGraphProps } from "./SkillsByDomain"
