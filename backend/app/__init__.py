# app package
try:
    import scverse_misc
    scverse_misc.Settings.model_config['extra'] = 'ignore'
except Exception:
    pass
