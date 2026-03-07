import sys
try:
    import requests
    print('requests version', requests.__version__)
except Exception as e:
    print('import error', repr(e), file=sys.stderr)
    sys.exit(1)
