-- Allow student_documents.document_url to be null
-- so that "physically provided" records can be stored without a file upload.
alter table student_documents alter column document_url drop not null;
