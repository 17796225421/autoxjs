import json

# 需要保留的字段
FIELDS_TO_KEEP = {
    "children",
    "id",
    "desc",
    "text"
}

def filter_layout(node):
    """
    递归地过滤JSON节点，只保留指定字段。

    :param node: 当前处理的节点
    :return: 过滤后的节点
    """
    if not isinstance(node, dict):
        return node

    filtered_node = {}
    for key, value in node.items():
        if key in FIELDS_TO_KEEP:
            # 若为children字段，需要递归处理子节点
            if key == "children":
                filtered_node[key] = [filter_layout(child) for child in value]
            else:
                filtered_node[key] = value
        # 无children但仍有子节点也需继续处理
        elif isinstance(value, (dict, list)):
            if isinstance(value, dict):
                sub_filtered = filter_layout(value)
                if sub_filtered:
                    filtered_node[key] = sub_filtered
            elif isinstance(value, list):
                sub_filtered_list = [filter_layout(item) for item in value if isinstance(item, (dict, list))]
                sub_filtered_list = [item for item in sub_filtered_list if item]
                if sub_filtered_list:
                    filtered_node[key] = sub_filtered_list

    return filtered_node


def process_json_file(input_file, output_file):
    """
    读取原始JSON文件，过滤字段后，输出新文件。

    :param input_file: 输入文件路径
    :param output_file: 输出文件路径
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        layout_data = json.load(f)

    filtered_data = filter_layout(layout_data)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered_data, f, ensure_ascii=False, indent=4)

    print(f"JSON文件已过滤，结果保存在 {output_file}")


if __name__ == "__main__":
    input_json_path = "layout.json"
    output_json_path = "layoutFiltered.json"

    process_json_file(input_json_path, output_json_path)
