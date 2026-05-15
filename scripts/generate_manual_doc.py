"""Generate software copyright operation manual as .docx"""
import os
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_ORIENT

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_NAME = "研究生论文过程管理系统V1.0"

def add_header_footer(doc):
    """Add header and footer to all sections"""
    for section in doc.sections:
        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = hp.add_run(f"{APP_NAME} 用户手册")
        run.font.size = Pt(9)
        run.font.name = '宋体'

        # Footer - page number
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = fp.add_run('')
        fp.add_run_field = True

def add_h1(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.space_before = Pt(24)
    p.space_after = Pt(12)
    run = p.add_run(text)
    run.font.size = Pt(15)
    run.font.bold = True
    run.font.name = '宋体'

def add_h2(doc, text):
    p = doc.add_paragraph()
    p.space_before = Pt(18)
    p.space_after = Pt(6)
    run = p.add_run(text)
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.name = '宋体'

def add_h3(doc, text):
    p = doc.add_paragraph()
    p.space_before = Pt(12)
    p.space_after = Pt(4)
    run = p.add_run(text)
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.name = '宋体'

def add_body(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0.74)
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    run.font.name = '宋体'

def add_step(doc, num, text):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    run = p.add_run(f"{num}. {text}")
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.name = '宋体'

def add_figure_placeholder(doc, fig_num, description):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.space_before = Pt(12)
    p.space_after = Pt(6)
    # Colored rectangle as placeholder
    run = p.add_run(f"【截图位置：图{fig_num} {description}】")
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(128, 128, 128)
    run.font.name = '宋体'

    # Figure caption
    cp = doc.add_paragraph()
    cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cp.add_run(f"图{fig_num} {description}")
    run.font.size = Pt(9)
    run.font.name = '宋体'

def main():
    doc = Document()

    # Page setup
    for section in doc.sections:
        section.page_width = Cm(21)
        section.page_height = Cm(29.7)
        section.top_margin = Cm(2.54)
        section.bottom_margin = Cm(2.54)
        section.left_margin = Cm(3.18)
        section.right_margin = Cm(3.18)

    add_header_footer(doc)

    # ===== 系统介绍 =====
    add_h1(doc, "系统介绍")
    add_body(doc, f"{APP_NAME}是一套面向高校研究生导师的论文过程管理工具。系统基于B/S架构，采用Next.js框架开发，使用SQLite数据库存储数据，无需安装客户端，通过浏览器即可访问使用。")
    add_body(doc, "系统主要功能包括：学生信息管理、小论文进度追踪、投稿记录管理、返修记录管理、大论文管理、综合查询与返修分析。系统支持文件附件上传，可按学生组织存储目录，支持Word、PDF、压缩包等常见文件格式。")
    add_body(doc, "系统面向研究生导师单人使用场景设计，界面简洁直观，操作流程清晰。导师可通过首页看板快速了解各年级学生的论文进展情况，通过学生详情页集中查看该学生的全部论文、投稿、返修和大论文信息。")

    # ===== 运行环境 =====
    add_h1(doc, "运行环境")
    add_body(doc, "硬件要求：普通PC或笔记本电脑，建议内存4GB以上，硬盘空闲空间1GB以上。")
    add_body(doc, "软件要求：操作系统Windows 10/11，需安装Node.js运行环境（版本18及以上），npm包管理器。")
    add_body(doc, "访问方式：在项目目录下执行命令npm run dev启动服务，浏览器访问http://localhost:3000即可打开系统首页。")

    # ===== 系统操作说明 =====
    add_h1(doc, "系统操作说明")

    # --- 首页看板 ---
    add_h2(doc, "一、首页看板")
    add_body(doc, "启动系统后，默认进入首页看板页面。首页按学生入学年份分组展示在读学生的论文卡片，每张卡片显示学生姓名、研究方向以及该学生的小论文学术进展。论文标题前标注目标投稿期刊名称，右侧显示当前状态标签。")
    add_figure_placeholder(doc, "1-1", "首页看板界面")
    add_step(doc, 1, "在左侧导航栏点击"首页"菜单，进入首页看板。")
    add_step(doc, 2, "查看各年级分组下的学生卡片，卡片按年级顺序排列，活跃论文在前。")
    add_step(doc, 3, "点击任意学生卡片，跳转至该学生详情页。")

    # --- 学生管理 ---
    add_h2(doc, "二、学生管理")
    add_body(doc, "学生管理页面用于维护研究生基本信息和学位类型。左侧提供筛选栏，可按状态（全部/在读/已毕业）和学位类型筛选学生。")
    add_figure_placeholder(doc, "2-1", "学生管理列表界面")

    add_h3(doc, "2.1 添加学生")
    add_step(doc, 1, "在学生管理页面，点击"添加学生"按钮，弹出添加学生对话框。")
    add_step(doc, 2, "在姓名框中输入学生姓名，在学号框中输入学号。")
    add_step(doc, 3, "在学位类型下拉框中选择对应的学位类型（如工学硕士、工业工程专硕等）。")
    add_step(doc, 4, "在状态下拉框中选择"在读"。")
    add_step(doc, 5, "填写入学年份、研究方向、导师等基本信息。")
    add_step(doc, 6, "勾选"首页看板可见"复选框（默认勾选）。")
    add_step(doc, 7, "点击"添加"按钮，学生信息保存成功。")
    add_figure_placeholder(doc, "2-2", "添加学生对话框")

    add_h3(doc, "2.2 编辑学生信息")
    add_step(doc, 1, "在学生列表中，点击目标学生行的编辑图标（铅笔图标）。")
    add_step(doc, 2, "在弹出的编辑对话框中修改需要变更的信息。")
    add_step(doc, 3, "如需将学生从首页看板移除，取消"首页看板可见"的勾选。")
    add_step(doc, 4, "点击"保存"按钮，修改生效。")

    add_h3(doc, "2.3 查看学生详情")
    add_step(doc, 1, "点击学生列表中的任意学生行，进入学生详情页。")
    add_step(doc, 2, "详情页按分区展示该学生的全部信息：小论文列表、大论文信息、时间线。")
    add_figure_placeholder(doc, "2-3", "学生详情页界面")

    # --- 小论文管理 ---
    add_h2(doc, "三、小论文管理")
    add_figure_placeholder(doc, "3-1", "小论文列表界面")
    add_body(doc, "小论文管理页面以表格形式展示所有小论文记录，包括标题、所属学生、类型、状态、目标期刊、版本标签等信息。顶部提供状态下拉筛选，可按全部状态或特定状态过滤。")

    add_h3(doc, "3.1 添加小论文")
    add_step(doc, 1, "在小论文管理页面，点击"添加小论文"按钮。")
    add_step(doc, 2, "在对话框中选择所属学生，输入论文标题。")
    add_step(doc, 3, "选择论文类型（期刊或会议）和当前状态（撰写中等）。")
    add_step(doc, 4, "填写第一作者、通讯作者、研究方向、目标期刊等信息。")
    add_step(doc, 5, "在"我的思考"文本区可记录导师对该论文的评价判断。")
    add_step(doc, 6, "点击"添加"按钮完成创建。")
    add_figure_placeholder(doc, "3-2", "添加小论文对话框")

    add_h3(doc, "3.2 编辑小论文与版本标签")
    add_step(doc, 1, "点击论文行的编辑图标，打开编辑对话框。")
    add_step(doc, 2, "在版本标签输入框中输入自定义标签，如V1_202601。")
    add_step(doc, 3, "修改其他需要变更的字段后，点击"保存"按钮。")

    add_h3(doc, "3.3 小论文详情与稿件版本")
    add_step(doc, 1, "点击论文列表中的论文行，进入论文详情页。")
    add_step(doc, 2, "左侧显示基本信息、我的思考、论文稿件版本管理。")
    add_step(doc, 3, "在稿件版本区域点击"上传新版本"，选择Word或PDF文件上传。")
    add_step(doc, 4, "右侧投稿历程区域展示该论文的全部投稿记录。")
    add_step(doc, 5, "点击投稿卡片的圆圈数字可展开审稿意见和返修记录。")
    add_step(doc, 6, "若有附件文件，在投稿卡片底部可下载查看。")
    add_figure_placeholder(doc, "3-3", "小论文详情页面")

    # --- 投稿记录 ---
    add_h2(doc, "四、投稿记录管理")
    add_figure_placeholder(doc, "4-1", "投稿记录列表界面")
    add_body(doc, "投稿记录管理页面以表格形式展示全部投稿信息。每行可展开查看审稿意见、编辑意见和返修轮次详情。展开后可添加返修轮次或上传附件。")

    add_h3(doc, "4.1 添加投稿记录")
    add_step(doc, 1, "在投稿记录页面，点击"添加投稿"按钮。")
    add_step(doc, 2, "选择所属小论文，输入投稿期刊或会议名称。")
    add_step(doc, 3, "填写稿件编号、投稿轮次、投稿日期。")
    add_step(doc, 4, "选择投稿状态（待处理/审稿中/已返回）。")
    add_step(doc, 5, "如有审稿意见，在审稿意见和编辑意见文本区填写。")
    add_step(doc, 6, "点击"添加投稿"按钮，记录创建成功后可在对话框下方上传投稿文章附件和补充材料。")
    add_figure_placeholder(doc, "4-2", "添加投稿记录对话框")

    add_h3(doc, "4.2 查看审稿意见与返修")
    add_step(doc, 1, "在投稿列表中，点击投稿行左侧的展开箭头。")
    add_step(doc, 2, "查看该投稿的审稿意见和编辑意见。")
    add_step(doc, 3, "查看已有的返修轮次详情。")
    add_step(doc, 4, "点击"添加返修轮次"按钮可新增返修记录。")

    # --- 返修记录 ---
    add_h2(doc, "五、返修记录管理")
    add_figure_placeholder(doc, "5-1", "返修记录列表界面")
    add_body(doc, "返修记录管理页面展示所有返修轮次信息。每行可点击附件图标展开上传面板。")

    add_h3(doc, "5.1 添加返修记录")
    add_step(doc, 1, "在返修记录页面或投稿展开区域，点击"添加返修"或"添加返修轮次"按钮。")
    add_step(doc, 2, "选择所属投稿记录，填写返修轮次。")
    add_step(doc, 3, "选择返修类型（小修/大修/重投）和状态。")
    add_step(doc, 4, "填写收到日期、截止日期。")
    add_step(doc, 5, "在审稿意见摘要中记录审稿意见要点。")
    add_step(doc, 6, "在返修结果/回复摘要中记录修改结果。")
    add_step(doc, 7, "点击"添加返修"按钮创建记录，之后可上传审稿意见附件和修改稿。")
    add_figure_placeholder(doc, "5-2", "添加返修记录对话框")

    add_h3(doc, "5.2 上传返修附件")
    add_step(doc, 1, "在返修记录的附件区域，输入附件描述。")
    add_step(doc, 2, "点击"上传附件"按钮，选择Word文档或压缩包文件。")
    add_step(doc, 3, "上传成功后附件显示在列表中，可下载或删除。")

    # --- 大论文管理 ---
    add_h2(doc, "六、大论文管理")
    add_figure_placeholder(doc, "6-1", "大论文列表界面")
    add_body(doc, "大论文管理页面以表格形式展示所有大论文记录，表格中直接显示三位外审专家分数和答辩成绩。")

    add_h3(doc, "6.1 添加大论文")
    add_step(doc, 1, "在大论文管理页面，点击"添加大论文"按钮。")
    add_step(doc, 2, "选择所属学生，输入大论文标题、学位类型。")
    add_step(doc, 3, "选择阶段（开题或答辩），填写开题日期和答辩日期。")
    add_step(doc, 4, "在外审专家评分区域，输入三位外审专家的分数。")
    add_step(doc, 5, "输入答辩成绩。点击"添加"完成创建。")
    add_figure_placeholder(doc, "6-2", "添加大论文对话框")

    add_h3(doc, "6.2 维护外审意见")
    add_step(doc, 1, "点击大论文行进入详情页。")
    add_step(doc, 2, "页面显示三位外审专家评审槽位，点击"录入评审"按钮。")
    add_step(doc, 3, "默认为匿名盲审模式，填写分数、决定、审阅日期和审稿意见。")
    add_step(doc, 4, "点击"添加"保存。已录入的评审可点击编辑图标修改。")
    add_step(doc, 5, "每个评审卡片下方可上传评审意见附件。")
    add_figure_placeholder(doc, "6-3", "大论文详情与外审意见")

    # --- 综合查询 ---
    add_h2(doc, "七、综合查询")
    add_figure_placeholder(doc, "7-1", "综合查询界面")
    add_body(doc, "综合查询页面提供两种视图：按论文查看和按学生查看。支持搜索框输入关键词进行全文检索，支持下拉选择状态筛选。")

    add_h3(doc, "7.1 按论文查询")
    add_step(doc, 1, "在综合查询页面，选择"按论文"标签页。")
    add_step(doc, 2, "在搜索框中输入论文标题、学生姓名或期刊名进行搜索。")
    add_step(doc, 3, "点击论文行左侧展开箭头，查看该论文的全部投稿记录。")
    add_step(doc, 4, "点击投稿行继续展开，查看返修轮次详情。")

    add_h3(doc, "7.2 按学生查询")
    add_step(doc, 1, "选择"按学生"标签页。")
    add_step(doc, 2, "点击学生行展开，显示该学生的全部小论文列表。")
    add_step(doc, 3, "继续展开论文行，查看投稿和返修详情。")

    # --- 返修分析 ---
    add_h2(doc, "八、返修分析")
    add_figure_placeholder(doc, "8-1", "返修分析界面")
    add_body(doc, "返修分析页面提供两种分析模式：AI分析和统计分析。")

    add_h3(doc, "8.1 统计分析")
    add_step(doc, 1, "选择"统计分析"标签页，查看返修数据概览。")
    add_step(doc, 2, "顶部分别显示返修总数、小修数量、大修数量、重投数量。")
    add_step(doc, 3, "下方表格按期刊和学生维度分别统计返修次数。")

    add_h3(doc, "8.2 AI关键词分析")
    add_step(doc, 1, "选择"AI分析"标签页。")
    add_step(doc, 2, "可通过学生、期刊、返修类型、日期范围筛选返修记录。")
    add_step(doc, 3, "勾选需要分析的返修记录，点击"AI分析选中"按钮。")
    add_step(doc, 4, "系统自动按六大类归类：实验不足、写作问题、创新不足、文献不足、图表质量、方法缺陷。")

    # --- 系统设置 ---
    add_h2(doc, "九、系统设置")
    add_figure_placeholder(doc, "9-1", "系统设置界面")
    add_body(doc, "系统设置页面提供文件存储配置、学位类型管理和首页卡片显示配置。")

    add_h3(doc, "9.1 文件存储设置")
    add_step(doc, 1, "在附件存储目录输入框中输入文件保存路径，支持绝对路径。")
    add_step(doc, 2, "勾选"按学生组织子目录"启用自动分类存储。")
    add_step(doc, 3, "点击"保存文件设置"按钮。")

    add_h3(doc, "9.2 学位类型管理")
    add_step(doc, 1, "在学位类型管理区域，输入新类型名称并点击"添加"。")
    add_step(doc, 2, "点击已有类型的编辑图标修改名称。")
    add_step(doc, 3, "点击删除图标移除不再使用的类型。")

    add_h3(doc, "9.3 首页卡片显示设置")
    add_step(doc, 1, "勾选需要在首页显示的小论文状态类型。")
    add_step(doc, 2, "可使用"全选"或"全不选"快捷按钮。")
    add_step(doc, 3, "点击"保存显示设置"应用更改。")

    # ===== 主题切换 =====
    add_h2(doc, "十、主题切换")
    add_step(doc, 1, "点击左侧导航栏底部的主题切换按钮。")
    add_step(doc, 2, "可在三种模式间循环切换：浅色模式、专业蓝调、深色模式。")
    add_figure_placeholder(doc, "10-1", "专业蓝调主题效果")

    # ===== 批量导入 =====
    add_h2(doc, "十一、批量导入")
    add_body(doc, "系统支持通过Excel模板批量导入数据。")
    add_step(doc, 1, "点击左侧导航"批量导入"菜单进入导入页面。")
    add_step(doc, 2, "点击"下载模板"按钮获取Excel模板文件。")
    add_step(doc, 3, "按模板中的四个Sheet（学生、小论文、投稿记录、返修记录）填写数据。")
    add_step(doc, 4, "点击"上传并导入"按钮，选择填写完成的Excel文件。")
    add_step(doc, 5, "查看导入结果显示，绿色表示成功，红色表示失败及原因。")
    add_figure_placeholder(doc, "11-1", "批量导入界面")

    # Save
    out_path = os.path.join(PROJECT_ROOT, '研究生论文过程管理系统V1.0_用户手册.docx')
    doc.save(out_path)
    print(f'Generated: {out_path}')

if __name__ == '__main__':
    main()
