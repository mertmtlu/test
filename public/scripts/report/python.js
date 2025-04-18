export function downloadPython(newContent, name = 'python') {
    // Create the Python script content with the provided HTML
    let script = `
import tkinter as tk
from tkinter import filedialog
from bs4 import BeautifulSoup
from docx import Document
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.enum.table import WD_ALIGN_VERTICAL
import os
import platform
import subprocess
import base64
from io import BytesIO
from PIL import Image
import tempfile
import win32com.client as win32

html = """${newContent}"""

def select_file(use_default = True):
    if not use_default:
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        file_path = filedialog.askopenfilename(filetypes=[("Word documents", "*.docx")])
        return file_path.replace('/', '\\\\')
    return '"C:\\\\Users\\\\Mert\\\\Desktop\\\\rep\\\\reference.docx"'

def get_reference_toc(reference_doc_path):
    try:
        word = win32.Dispatch("Word.Application")
        reference_doc = word.Documents.Open(reference_doc_path)
        toc = reference_doc.TablesOfContents(1)
        temp_doc = word.Documents.Add()
        toc.Range.Copy()
        temp_doc.Range().Paste()
        toc_path = tempfile.gettempdir() + "\\\\temp_toc.docx"
        temp_doc.SaveAs(toc_path)
        reference_doc.Close(False)
        temp_doc.Close(False)
        return toc_path
    except Exception as e:
        print(f"Error extracting TOC from reference document: {e}")
        return None
    finally:
        word.Quit()

def insert_toc(doc_path, toc_path):
    try:
        word = win32.Dispatch("Word.Application")
        word.DisplayAlerts = 0  # Disable all alerts
        word.Visible = False  # Set to True if you want to see the process in Word

        doc = word.Documents.Open(doc_path)
        toc_doc = word.Documents.Open(toc_path)

        # Search for the "İÇİNDEKİLER" heading in the document
        found = False
        for paragraph in doc.Paragraphs:
            if "İÇİNDEKİLER" in paragraph.Range.Text.strip():
                # Move the cursor to the end of the "İÇİNDEKİLER" paragraph
                paragraph.Range.InsertParagraphAfter()
                insert_point = paragraph.Range.Next().Start
                doc.Range(insert_point, insert_point).Paste()  # Paste the TOC here
                found = True
                break

        if not found:
            print("İÇİNDEKİLER header not found. Appending TOC at the beginning of the document.")
            doc.Range(0, 0).Paste()  # Default to inserting at the beginning if not found

        wdHeaderFooterPrimary = 1 
        last_section = doc.Sections(doc.Sections.Count)
        
        last_section.Footers(wdHeaderFooterPrimary).PageNumbers.RestartNumberingAtSection = True
        last_section.Footers(wdHeaderFooterPrimary).PageNumbers.StartingNumber = 1
        last_section.Footers(wdHeaderFooterPrimary).PageNumbers.Add(1, True) # Add page number 1 means middle
        last_section.Footers(wdHeaderFooterPrimary).LinkToPrevious = False

        for i in range(1, doc.Sections.Count):
            if doc.Sections(i) != last_section:
                section = doc.Sections(i)
                for j in range(1, section.Footers.Count):
                    footer = section.Footers(j)
                    footer.Range.Text = ''
                    
                    for k in range(1, footer.PageNumbers.Count):
                        footer.PageNumbers(k).Delete()

        # Update all TOC
        if doc.TablesOfContents.Count > 0:
            for t in doc.TablesOfContents:
                t.Update()

        doc.Save()
        doc.Close(SaveChanges=True)
        toc_doc.Close(SaveChanges=False)

    except Exception as e:
        print(f"Error inserting TOC: {e}")
    finally:
        word.Quit()

def getIndex(targetCell, table):
    for row_index, row in enumerate(table.rows):
        for col_index, cell in enumerate(row.cells):
            if cell._element is targetCell._element:
                return (row_index, col_index)
    return (-1, -1)

def merge_cells(table, cell, colspan, rowspan, cell_matrix):
    row_index, col_index = getIndex(cell, table)
    if row_index == -1 or col_index == -1:
        print("Cell not found in the table")
        return

    for i in range(row_index, row_index + rowspan):
        for j in range(col_index, col_index + colspan):
            firstCell = table.cell(row_index, j)
            if i == row_index:
                continue
            try:
                nextCell = table.cell(i, j)
                cell_matrix[i][j] = True
                firstCell._element.merge(nextCell._element)
            except IndexError:
                print(f"Cell at row {i}, column {j} is out of bounds.")
                return
    for i in range(col_index, col_index + colspan):
        if i == col_index:
            continue
        try:
            nextCell = table.cell(row_index, i)
            cell_matrix[row_index][i] = True
            cell._element.merge(nextCell._element)
        except IndexError:
            print(f"Cell at row {i}, column {j} is out of bounds.")
            return

def apply_styles(run, element):
    try:
        if element.name is not None:
            classes = element.get("class", [])
            if isinstance(classes, str):
                classes = classes.split()
            for cls in classes:
                if cls.startswith("ql-font-"):
                    font_name = cls.replace("ql-font-", "").replace("-", " ")
                    run.font.name = font_name
                    run._element.rPr.rFonts.set(qn("w:eastAsia"), font_name)
                elif cls.startswith("ql-size-"):
                    size = cls.replace("ql-size-", "").replace("-", " ")
                    if size == "small":
                        run.font.size = Pt(8)
                    elif size == "large":
                        run.font.size = Pt(14)
                    elif size == "huge":
                        run.font.size = Pt(18)
                    else:
                        try:
                            size_pt = int(size)
                            run.font.size = Pt(size_pt)
                        except ValueError:
                            pass
            if element.name == "strong":
                run.bold = True
            if element.name == "em":
                run.italic = True
            if element.name == "u":
                run.underline = True
            if element.name == "sub":
                run.font.subscript = True
            if element.name == "sup":
                run.font.superscript = True
            if "style" in element.attrs:
                styles = element.attrs["style"].split(";")
                for style in styles:
                    if "background-color:" in style:
                        color_value = style.split(":")[1].strip()
                        if color_value.startswith("rgb"):
                            rgb_values = [int(x.strip()) for x in color_value[4:-1].split(",")]
                            rgb_hex = ''.join(f'{c:02X}' for c in rgb_values)
                            highlight_color = rgb_hex
                            if run.font.name is None:
                                run.font.name = 'Cambria'
                            run._element.rPr.append(
                                parse_xml(r'<w:shd {} w:fill="{}"/>'.format(nsdecls('w'), highlight_color)))
                        elif color_value.startswith("#") and len(color_value) == 7:
                            highlight = {
                                "yellow": "yellow",
                                "red": "red",
                                # Add more colors as needed
                            }.get(color_value, None)
                            if highlight:
                                run.font.highlight_color = highlight
                    elif "color:" in style:
                        color_value = style.split(":")[1].strip()
                        if color_value.startswith("rgb"):
                            rgb_values = color_value[4:-1].split(",")
                            rgb_hex = ''.join(f'{int(c):02X}' for c in rgb_values)
                            run.font.color.rgb = RGBColor.from_string(rgb_hex)
                        elif color_value.startswith("#") and len(color_value) == 7:
                            try:
                                run.font.color.rgb = RGBColor.from_string(color_value.lstrip("#"))
                            except ValueError as e:
                                print(f"Invalid color value: {color_value} - {e}")
    except Exception as e:
        print(f"Error applying styles: {e}")


def apply_alignment(para, element):
    try:
        if element.name is not None:
            classes = element.get("class", [])
            if isinstance(classes, str):
                classes = classes.split()
            for cls in classes:
                if cls == "ql-align-center":
                    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                elif cls == "ql-align-right":
                    para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                elif cls == "ql-align-justify":
                    para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    except Exception as e:
        print(f"Error applying alignment: {e}")

def html_to_docx(html):
    try:
        soup = BeautifulSoup(html, "html.parser")
        doc = Document()

        def get_image_size(image, max_width):
            max_width = max_width / 12700
            ratio = min(1, max_width / image.width)
            new_width = int(image.width * ratio)
            new_height = int(image.height * ratio)
            return new_width, new_height

        def handle_element(element, para=None):
            if element.name in ["h1", "h2", "p", "span", "strong", "em", "u", "sub", "sup", "img"]:
                if element.name == "h1":
                    para = doc.add_heading(level=1)
                elif element.name == "h2":
                    para = doc.add_heading(level=2)
                elif element.name == "img":
                    img_data = element.get("src", "")
                    if img_data.startswith("data:image"):
                        base64_str = img_data.split(",")[1]
                        img_bytes = base64.b64decode(base64_str)

                        image_stream = BytesIO(img_bytes)
                        image = Image.open(image_stream)

                        # Resize image to fit A4 page width
                        max_width = doc.sections[0].page_width - doc.sections[0].left_margin - doc.sections[
                            0].right_margin
                        new_width, new_height = get_image_size(image, max_width)

                        # Save resized image to a temporary file
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_image_file:
                            image = image.resize((new_width, new_height), Image.LANCZOS)
                            image.save(temp_image_file.name)
                            temp_image_file.close()
                            doc.add_picture(temp_image_file.name)
                            os.remove(temp_image_file.name)
                elif para is None:
                    para = doc.add_paragraph()

                # Insert a page break if the p element contains "pageBreak"
                if element.name == "p" and "pageBreak" in element.get_text():
                    doc.add_section()
                    return

                for child in element.children:
                    if isinstance(child, str):
                        run = para.add_run(child)
                        apply_styles(run, element)
                    else:
                        handle_element(child, para)
                apply_alignment(para, element)
                if element.name in ["h1", "h2"]:
                    for run in para.runs:
                        if element.name == "h1":
                            run.font.size = Pt(18)
                        if element.name == "h2":
                            run.font.size = Pt(14)
            elif element.name == "table":
                rows = element.find_all("tr")
                if not rows:
                    return  # Skip if no rows are found

                max_cols = 0
                max_rows = 0
                cellsToBeSkipped = []

                for row in rows:
                    cols = row.find_all(["td", "th"])
                    total_colspan = sum(int(cell.get("colspan", 1)) for cell in cols)
                    max_cols = max(max_cols, total_colspan)

                    if int(cols[0].get("rowspan", 1)) > 1:
                        for i in range(int(cols[0].get("data-row", 1)) + 1, int(cols[0].get("data-row", 1)) + int(cols[0].get("rowspan", 1))):
                            cellsToBeSkipped.append((i))

                    if int(cols[0].get("data-row", 1)) not in cellsToBeSkipped:
                        max_rows = max_rows + int(cols[0].get("rowspan", 1))

                # Now you can create the table with calculated max_rows and max_cols
                table = doc.add_table(rows=max_rows, cols=max_cols)
                table.autofit = True
                table.style = 'Table Grid'

                for row in table.rows:
                    for cell in row.cells:
                        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

                # Initialize cell matrix
                cell_matrix = [[False for _ in range(max_cols)] for _ in range(max_rows)]

                column_widths = [0] * max_cols  # List to store column widths

                for row_idx, row in enumerate(rows):
                    cells = row.find_all(["td", "th"])
                    col_idx = 0
                    for cell in cells:
                        while col_idx < max_cols and cell_matrix[row_idx][col_idx]:
                            col_idx += 1

                        colspan = int(cell.get("colspan", 1))
                        rowspan = int(cell.get("rowspan", 1))

                        row_cells = table.row_cells(row_idx)
                        cell_para = row_cells[col_idx].paragraphs[0]

                        if cell.name is not None:
                            styles = cell.get("style", [])
                            if isinstance(styles, str):
                                styles = styles.split("; ")

                            for stl in styles:
                                stl = stl.split(": ")
                                if stl[0] == "width":
                                    stl[1] = stl[1].replace("px;", "")
                                    stl[1] = stl[1].replace("px", "")
                                    stl[1] = round(float(stl[1])) * 12700

                                    row_cells[col_idx].width = stl[1]

                                    column_widths[col_idx] = max(column_widths[col_idx], stl[1] // colspan)  # Store the max width for the column

                                if stl[0] == "height":
                                    stl[1] = stl[1].replace("px;", "")
                                    stl[1] = stl[1].replace("px", "")
                                    stl[1] = round(float(stl[1])) * 12700

                                    table.rows[row_idx].height = stl[1]

                        for cell_child in cell.children:
                            if isinstance(cell_child, str):
                                run = cell_para.add_run(cell_child)
                                apply_styles(run, cell)
                            elif cell_child.name == "img":
                                img_data = cell_child.get("src", "")
                                if img_data.startswith("data:image"):
                                    base64_str = img_data.split(",")[1]
                                    img_bytes = base64.b64decode(base64_str)

                                    image_stream = BytesIO(img_bytes)
                                    image = Image.open(image_stream)


                                    # Resize image to fit table cell width
                                    cell_width = row_cells[col_idx].width
                                    new_width, new_height = get_image_size(image, cell_width)

                                    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as temp_image_file:
                                        image = image.resize((new_width, new_height), Image.LANCZOS)
                                        image.save(temp_image_file.name)
                                        temp_image_file.close()
                                        run = cell_para.add_run()
                                        run.add_picture(temp_image_file.name)
                                        os.remove(temp_image_file.name)
                            else:
                                handle_element(cell_child, cell_para)
                        apply_alignment(cell_para, cell)


                        if colspan > 1 or rowspan > 1:
                            merge_cells(table, row_cells[col_idx], colspan, rowspan, cell_matrix)

                        for i in range(rowspan):
                            for j in range(colspan):
                                cell_matrix[row_idx + i][col_idx + j] = True

                        col_idx += colspan

                # Adjust column widths proportionally to fit A4 page width
                total_width_px = sum(column_widths)
                page_width = doc.sections[0].page_width - doc.sections[0].left_margin

                if total_width_px == 0:
                    # If all columns are zero, set them to equal widths
                    equal_width_px = page_width / len(column_widths)
                    column_widths = [equal_width_px] * len(column_widths)
                    total_width_px = page_width
                elif 0 in column_widths:
                    # Calculate remaining width after accounting for non-zero columns
                    non_zero_width_px = sum(width for width in column_widths if width > 0)
                    remaining_width = page_width - (non_zero_width_px / total_width_px) * page_width

                    # Distribute remaining width to columns with zero width
                    zero_count = column_widths.count(0)
                    additional_width_per_column = remaining_width / zero_count

                    # Update column widths
                    column_widths = [
                        width if width > 0 else additional_width_per_column
                        for width in column_widths
                    ]

                    # Update total_width_px to reflect the adjusted widths
                    total_width_px = sum(column_widths)

                for col_idx, col_width_px in enumerate(column_widths):
                    col_width_twips = (col_width_px / total_width_px) * page_width
                    for row in table.rows:
                        row.cells[col_idx].width = col_width_twips

        for element in soup.children:
            handle_element(element, None)

        return doc
    except Exception as e:
        print(f"Error converting HTML to DOCX: {e}")
        return None

try:
    root = tk.Tk()
    root.withdraw()

    file_path = filedialog.asksaveasfilename(
        defaultextension=".docx",
        filetypes=[("Word Documents", "*.docx")],
        title="Save Document As"
    )

    if file_path:
        document = html_to_docx(html)
        if document is not None:
            print("Writing on docx...")
            document.save(file_path)

            # Insert TOC after saving the document if possible use default reference
            try:
                toc_reference_path = select_file()
                toc_path = get_reference_toc(toc_reference_path)
                if toc_path:
                    insert_toc(file_path, toc_path)
            except:
                toc_reference_path = select_file(False)
                toc_path = get_reference_toc(toc_reference_path)
                if toc_path:
                    insert_toc(file_path, toc_path)


            # Open the file with the default application
            try:
                if platform.system() == "Windows":
                    os.startfile(file_path)
                elif platform.system() == "Darwin":
                    subprocess.call(["open", file_path])
                else:
                    subprocess.call(["xdg-open", file_path])
            except Exception as e:
                print(f"Error opening file: {e}")
                input("Press Enter to exit...")
except Exception as e:
    print(f"Error: {e}")
    input("Press Enter to exit...")
`;

    // Create a blob with the Python script content
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create a download link and trigger a click to download the file
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.py';
    a.click();

    // Revoke the object URL to release memory
    URL.revokeObjectURL(url);

    return script;
}