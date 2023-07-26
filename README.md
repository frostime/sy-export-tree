## Export Document Tree Structure

Export the structure of your current note document tree as a yaml formatted text file.

> Note: Once the export task is turned on, it cannot be closed, and the use of notes during the export period will be significantly stuck, it is best to choose a free time to perform the export task.

The basic structure of the exported yaml is as follows:

1. Topmost

    ```yaml
    Number of Documents: 60
    Export Time: "2023-7-24 13:17:1"
    Notebooks:
      - Notebook ID: "20210808180117-czj9bvb"
        Notebook Name: "Notebook A"
        New Flashcards: 0
        Due Flashcards: 0
        Flashcards: 0
        Number of Documents: 60
        Document Tree:
    ```

2. Document

    ```yaml
    - Document ID: "20200812220555-lj3enxa"
      Document Title: "请从这里开始"
      Created: "2020-08-12 22:05:55"
      Updated: "2023-04-28 16:53:09"
      Number of Child Documents: 6
      Number of Offspring Documents: 50
      Document Information:
        Character Count: 245
        Word Count: 245
        Number of Links: 5
        Reference Count: 7
      Child Documents:
    ```

    Each level of the document hierarchy is shown above and contains basic information about the document. If there are sub-documents under this document, the basic structure of the sub-documents will be nested in the same structure under the "Child Documents" field.

    - Number of Child Documents: The number of sub-documents directly belonging to the current document.
    - Number of Offspring Documents: The number of all documents in the subordinate document tree, including the "Number of Child Documents".