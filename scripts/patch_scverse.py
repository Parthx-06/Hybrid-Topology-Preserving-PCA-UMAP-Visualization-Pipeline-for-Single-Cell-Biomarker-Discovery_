import pathlib
import scverse_misc._settings as s

p = pathlib.Path(s.__file__)
code = p.read_text("utf-8")
target = 'config["dotenv_filtering"] = dotenv_filtering'
replacement = 'config["dotenv_filtering"] = dotenv_filtering\n        config["extra"] = "ignore"'
if target in code and 'config["extra"] = "ignore"' not in code:
    code = code.replace(target, replacement)
    p.write_text(code, "utf-8")
    print("Successfully patched scverse_misc!")
else:
    print("Already patched or target not found.")
