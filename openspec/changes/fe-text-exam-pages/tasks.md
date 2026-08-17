# Tasks — fe-text-exam-pages

- [x] 1.1 Type `FeImageKind`, `FeImageView.{kind,textContent,sourceFilename}`, `imageUrl` nullable,
      `FeTextImportResult`/`FeTextImportFailure`
- [x] 1.2 `importFeAlbumTextFile` (`POST /resources/{id}/text-items`)
- [x] 1.3 `useMutateImportFeAlbumTextsSwr` — một file mỗi request, tuần tự, gom lỗi từng file
- [x] 2.1 `ExamImageViewer`: trang TEXT render `MarkdownContent`, thumbnail icon + tên file,
      bỏ prefetch cho trang chữ
- [x] 2.2 `FeAlbumManager`: nút "Thêm đề dạng văn bản" + input `.txt/.md` + tiến độ + báo lỗi/cảnh báo
- [x] 2.3 `SubjectFeAlbum`: truyền `kind/textContent/sourceFilename` xuống viewer
- [x] 3.1 i18n vi/en (`practice.fe.manage.{addText,textImported}`)
- [x] 4.1 `tsc --noEmit` sạch · eslint sạch · `npm test` 1413 test xanh (+3 ca mới cho trang chữ)
